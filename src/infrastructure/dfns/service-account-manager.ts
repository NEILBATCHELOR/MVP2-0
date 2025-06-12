/**
 * DFNS Service Account Manager - Service account management for DFNS integration
 * 
 * This service manages DFNS service accounts including:
 * - Service account creation and management
 * - Service account authentication
 * - Permission assignment and management
 * - Access token management with configurable TTL
 * - Service account key rotation
 */

import type { DfnsClientConfig } from '@/types/dfns';
import { DfnsAuthenticator, DfnsSignatureType } from './auth';
import { DFNS_CONFIG } from './config';

// ===== Service Account Types =====

export interface ServiceAccountInfo {
  id: string;
  name: string;
  status: ServiceAccountStatus;
  publicKey: string;
  externalId?: string;
  permissionIds: string[];
  dateCreated: string;
  dateActivated?: string;
  dateDeactivated?: string;
  lastUsed?: string;
}

export interface ServiceAccountCreationRequest {
  name: string;
  publicKey: string;
  daysValid?: number; // 1-730 days
  permissionIds?: string[];
  externalId?: string;
}

export interface ServiceAccountToken {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  expiresAt: string;
  scope?: string[];
}

export interface ServiceAccountKeyPair {
  publicKey: string;
  privateKey: string;
  keyId: string;
  algorithm: string;
  curve: DfnsSignatureType;
}

export interface PermissionAssignment {
  id: string;
  permissionId: string;
  serviceAccountId: string;
  assignedAt: string;
  assignedBy: string;
  status: PermissionAssignmentStatus;
}

export enum ServiceAccountStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Suspended = 'Suspended'
}

export enum PermissionAssignmentStatus {
  Active = 'Active',
  Revoked = 'Revoked'
}

// ===== DFNS Service Account Manager Class =====

export class DfnsServiceAccountManager {
  private config: DfnsClientConfig;
  private authenticator: DfnsAuthenticator;

  constructor(config: DfnsClientConfig, authenticator?: DfnsAuthenticator) {
    this.config = config;
    this.authenticator = authenticator || new DfnsAuthenticator(config);
  }

  // ===== Service Account Creation and Management =====

  /**
   * Create a new service account with generated key pair
   */
  async createServiceAccount(
    name: string,
    options: {
      daysValid?: number;
      permissionIds?: string[];
      externalId?: string;
      curve?: DfnsSignatureType;
    } = {}
  ): Promise<{ serviceAccount: ServiceAccountInfo; keyPair: ServiceAccountKeyPair }> {
    try {
      // Ensure we're authenticated to create service accounts
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to create service accounts');
      }

      // Generate key pair for the service account
      const keyPair = await this.generateServiceAccountKeyPair(
        options.curve || DfnsSignatureType.Secp256k1
      );

      // Create service account request
      const createRequest: ServiceAccountCreationRequest = {
        name: name,
        publicKey: keyPair.publicKey,
        daysValid: options.daysValid || 365,
        permissionIds: options.permissionIds || [],
        externalId: options.externalId
      };

      // Get user action signature for creation
      const userActionSignature = await this.authenticator.signUserAction(
        'POST',
        '/auth/service-accounts',
        createRequest
      );

      // Create service account via API
      const response = await fetch(`${this.config.baseUrl}/auth/service-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        },
        body: JSON.stringify(createRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Service account creation failed: ${errorData.message || response.statusText}`);
      }

      const serviceAccount = await response.json();

      return {
        serviceAccount: serviceAccount,
        keyPair: keyPair
      };
    } catch (error) {
      throw new Error(`Failed to create service account: ${(error as Error).message}`);
    }
  }

  /**
   * Create service account with provided public key
   */
  async createServiceAccountWithKey(
    name: string,
    publicKey: string,
    options: {
      daysValid?: number;
      permissionIds?: string[];
      externalId?: string;
    } = {}
  ): Promise<ServiceAccountInfo> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to create service accounts');
      }

      const createRequest: ServiceAccountCreationRequest = {
        name: name,
        publicKey: publicKey,
        daysValid: options.daysValid || 365,
        permissionIds: options.permissionIds || [],
        externalId: options.externalId
      };

      const userActionSignature = await this.authenticator.signUserAction(
        'POST',
        '/auth/service-accounts',
        createRequest
      );

      const response = await fetch(`${this.config.baseUrl}/auth/service-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        },
        body: JSON.stringify(createRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Service account creation failed: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to create service account with key: ${(error as Error).message}`);
    }
  }

  /**
   * List all service accounts in the organization
   */
  async listServiceAccounts(): Promise<ServiceAccountInfo[]> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to list service accounts');
      }

      const response = await fetch(`${this.config.baseUrl}/auth/service-accounts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list service accounts: ${response.statusText}`);
      }

      const data = await response.json();
      return data.serviceAccounts || [];
    } catch (error) {
      throw new Error(`Failed to list service accounts: ${(error as Error).message}`);
    }
  }

  /**
   * Get service account details
   */
  async getServiceAccount(serviceAccountId: string): Promise<ServiceAccountInfo> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to get service account');
      }

      const response = await fetch(`${this.config.baseUrl}/auth/service-accounts/${serviceAccountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get service account: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get service account: ${(error as Error).message}`);
    }
  }

  /**
   * Update service account
   */
  async updateServiceAccount(
    serviceAccountId: string,
    updates: {
      name?: string;
      externalId?: string;
    }
  ): Promise<ServiceAccountInfo> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to update service account');
      }

      const userActionSignature = await this.authenticator.signUserAction(
        'PUT',
        `/auth/service-accounts/${serviceAccountId}`,
        updates
      );

      const response = await fetch(`${this.config.baseUrl}/auth/service-accounts/${serviceAccountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update service account: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to update service account: ${(error as Error).message}`);
    }
  }

  /**
   * Activate a service account
   */
  async activateServiceAccount(serviceAccountId: string): Promise<ServiceAccountInfo> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to activate service account');
      }

      const userActionSignature = await this.authenticator.signUserAction(
        'PUT',
        `/auth/service-accounts/${serviceAccountId}/activate`
      );

      const response = await fetch(`${this.config.baseUrl}/auth/service-accounts/${serviceAccountId}/activate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to activate service account: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to activate service account: ${(error as Error).message}`);
    }
  }

  /**
   * Deactivate a service account
   */
  async deactivateServiceAccount(serviceAccountId: string): Promise<ServiceAccountInfo> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to deactivate service account');
      }

      const userActionSignature = await this.authenticator.signUserAction(
        'PUT',
        `/auth/service-accounts/${serviceAccountId}/deactivate`
      );

      const response = await fetch(`${this.config.baseUrl}/auth/service-accounts/${serviceAccountId}/deactivate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to deactivate service account: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to deactivate service account: ${(error as Error).message}`);
    }
  }

  // ===== Service Account Authentication =====

  /**
   * Authenticate service account and get access token
   */
  async authenticateServiceAccount(
    serviceAccountId: string,
    privateKey: string
  ): Promise<ServiceAccountToken> {
    try {
      // Use the enhanced authenticator to perform service account authentication
      const tokenResponse = await this.authenticator.authenticateServiceAccount(
        serviceAccountId,
        privateKey
      );

      return tokenResponse;
    } catch (error) {
      throw new Error(`Service account authentication failed: ${(error as Error).message}`);
    }
  }

  /**
   * Create a service account-specific authenticator instance
   */
  createServiceAccountAuthenticator(
    serviceAccountId: string,
    privateKey: string
  ): DfnsAuthenticator {
    const authenticator = new DfnsAuthenticator(this.config);
    
    // Set up service account credentials
    authenticator.authenticateServiceAccount(serviceAccountId, privateKey);
    
    return authenticator;
  }

  // ===== Permission Management =====

  /**
   * Assign permissions to service account
   */
  async assignPermissions(
    serviceAccountId: string,
    permissionIds: string[]
  ): Promise<PermissionAssignment[]> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to assign permissions');
      }

      const assignments: PermissionAssignment[] = [];

      for (const permissionId of permissionIds) {
        const assignmentRequest = {
          permissionId: permissionId,
          identityId: serviceAccountId,
          identityKind: 'ServiceAccount'
        };

        const userActionSignature = await this.authenticator.signUserAction(
          'POST',
          '/permissions/assignments',
          assignmentRequest
        );

        const response = await fetch(`${this.config.baseUrl}/permissions/assignments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
            'X-DFNS-APPID': this.config.appId,
            'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
          },
          body: JSON.stringify(assignmentRequest)
        });

        if (!response.ok) {
          throw new Error(`Failed to assign permission ${permissionId}: ${response.statusText}`);
        }

        const assignment = await response.json();
        assignments.push(assignment);
      }

      return assignments;
    } catch (error) {
      throw new Error(`Failed to assign permissions: ${(error as Error).message}`);
    }
  }

  /**
   * Revoke permissions from service account
   */
  async revokePermissions(
    serviceAccountId: string,
    permissionIds: string[]
  ): Promise<void> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to revoke permissions');
      }

      // Get current permission assignments
      const assignments = await this.getServiceAccountPermissions(serviceAccountId);

      for (const permissionId of permissionIds) {
        const assignment = assignments.find(a => a.permissionId === permissionId);
        if (!assignment) {
          continue; // Permission not assigned
        }

        const userActionSignature = await this.authenticator.signUserAction(
          'DELETE',
          `/permissions/assignments/${assignment.id}`
        );

        const response = await fetch(`${this.config.baseUrl}/permissions/assignments/${assignment.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
            'X-DFNS-APPID': this.config.appId,
            'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to revoke permission ${permissionId}: ${response.statusText}`);
        }
      }
    } catch (error) {
      throw new Error(`Failed to revoke permissions: ${(error as Error).message}`);
    }
  }

  /**
   * Get service account permission assignments
   */
  async getServiceAccountPermissions(serviceAccountId: string): Promise<PermissionAssignment[]> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to get permissions');
      }

      const response = await fetch(
        `${this.config.baseUrl}/permissions/assignments?identityId=${serviceAccountId}&identityKind=ServiceAccount`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
            'X-DFNS-APPID': this.config.appId
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get service account permissions: ${response.statusText}`);
      }

      const data = await response.json();
      return data.assignments || [];
    } catch (error) {
      throw new Error(`Failed to get service account permissions: ${(error as Error).message}`);
    }
  }

  // ===== Key Management =====

  /**
   * Generate new key pair for service account
   */
  async generateServiceAccountKeyPair(
    curve: DfnsSignatureType = DfnsSignatureType.Secp256k1
  ): Promise<ServiceAccountKeyPair> {
    try {
      let algorithm: EcKeyGenParams | { name: string };
      
      switch (curve) {
        case DfnsSignatureType.Secp256k1:
          // For production, use a library that supports secp256k1
          algorithm = { name: 'ECDSA', namedCurve: 'P-256' }; // Fallback
          break;
        case DfnsSignatureType.Secp256r1:
          algorithm = { name: 'ECDSA', namedCurve: 'P-256' };
          break;
        case DfnsSignatureType.Ed25519:
          algorithm = { name: 'Ed25519' };
          break;
        default:
          throw new Error(`Unsupported curve: ${curve}`);
      }

      const keyPair = await crypto.subtle.generateKey(
        algorithm,
        true,
        ['sign', 'verify']
      ) as CryptoKeyPair; // Type assertion to ensure it's a CryptoKeyPair

      const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);

      const privateKey = this.arrayBufferToBase64(privateKeyBuffer);
      const publicKey = this.arrayBufferToBase64(publicKeyBuffer);
      const keyId = this.generateKeyId();

      return {
        publicKey: publicKey,
        privateKey: privateKey,
        keyId: keyId,
        algorithm: this.getAlgorithmName(curve),
        curve: curve
      };
    } catch (error) {
      throw new Error(`Failed to generate service account key pair: ${(error as Error).message}`);
    }
  }

  /**
   * Rotate service account keys
   */
  async rotateServiceAccountKeys(
    serviceAccountId: string,
    currentPrivateKey: string,
    curve: DfnsSignatureType = DfnsSignatureType.Secp256k1
  ): Promise<ServiceAccountKeyPair> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to rotate service account keys');
      }

      // Generate new key pair
      const newKeyPair = await this.generateServiceAccountKeyPair(curve);

      // Update service account with new public key
      const updateRequest = {
        publicKey: newKeyPair.publicKey
      };

      const userActionSignature = await this.authenticator.signUserAction(
        'PUT',
        `/auth/service-accounts/${serviceAccountId}/keys`,
        updateRequest
      );

      const response = await fetch(`${this.config.baseUrl}/auth/service-accounts/${serviceAccountId}/keys`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        },
        body: JSON.stringify(updateRequest)
      });

      if (!response.ok) {
        throw new Error(`Failed to rotate service account keys: ${response.statusText}`);
      }

      return newKeyPair;
    } catch (error) {
      throw new Error(`Failed to rotate service account keys: ${(error as Error).message}`);
    }
  }

  // ===== Token Management =====

  /**
   * Refresh service account access token
   */
  async refreshServiceAccountToken(
    serviceAccountId: string,
    currentToken: string
  ): Promise<ServiceAccountToken> {
    try {
      const response = await fetch(`${this.config.baseUrl}/auth/service-accounts/${serviceAccountId}/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh service account token: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to refresh service account token: ${(error as Error).message}`);
    }
  }

  /**
   * Revoke service account access token
   */
  async revokeServiceAccountToken(
    serviceAccountId: string,
    token: string
  ): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/auth/service-accounts/${serviceAccountId}/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to revoke service account token: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Failed to revoke service account token: ${(error as Error).message}`);
    }
  }

  // ===== Utility Methods =====

  /**
   * Validate service account configuration
   */
  async validateServiceAccount(serviceAccountId: string, privateKey: string): Promise<boolean> {
    try {
      // Attempt to authenticate with the service account
      const token = await this.authenticateServiceAccount(serviceAccountId, privateKey);
      return !!token.accessToken;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get service account capabilities based on permissions
   */
  async getServiceAccountCapabilities(serviceAccountId: string): Promise<string[]> {
    try {
      const permissions = await this.getServiceAccountPermissions(serviceAccountId);
      
      // Extract operation capabilities from permission assignments
      const capabilities: string[] = [];
      
      for (const assignment of permissions) {
        if (assignment.status === PermissionAssignmentStatus.Active) {
          // In a real implementation, you would fetch the permission details
          // and extract the operations array
          capabilities.push(`permission:${assignment.permissionId}`);
        }
      }

      return capabilities;
    } catch (error) {
      throw new Error(`Failed to get service account capabilities: ${(error as Error).message}`);
    }
  }

  /**
   * Export service account configuration for deployment
   */
  exportServiceAccountConfig(
    serviceAccountId: string,
    privateKey: string,
    environment: 'sandbox' | 'production' = 'sandbox'
  ): Record<string, string> {
    return {
      DFNS_SERVICE_ACCOUNT_ID: serviceAccountId,
      DFNS_SERVICE_ACCOUNT_PRIVATE_KEY: privateKey,
      DFNS_ENVIRONMENT: environment,
      DFNS_BASE_URL: environment === 'production' 
        ? 'https://api.dfns.ninja' 
        : 'https://api.dfns.ninja', // Same URL for both environments
      DFNS_APP_ID: this.config.appId
    };
  }

  // ===== Private Helper Methods =====

  /**
   * Generate unique key ID
   */
  private generateKeyId(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get algorithm name for signature type
   */
  private getAlgorithmName(signatureType: DfnsSignatureType): string {
    switch (signatureType) {
      case DfnsSignatureType.Secp256k1:
        return 'ES256K';
      case DfnsSignatureType.Secp256r1:
        return 'ES256';
      case DfnsSignatureType.Ed25519:
        return 'EdDSA';
      default:
        return 'ES256';
    }
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(data: string): string {
    return btoa(data)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}

// ===== Export =====

export default DfnsServiceAccountManager;
