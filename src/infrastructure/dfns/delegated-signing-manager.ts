/**
 * DFNS Delegated Signing Manager - Advanced WebAuthn and credential management
 * 
 * This service implements DFNS's delegated signing architecture where wallet control
 * is delegated from service providers to end users through biometric authentication
 * and API signing secrets.
 */

import type { DfnsClientConfig } from '@/types/dfns';
import { DfnsAuthenticator } from './auth';
import { DFNS_CONFIG, DFNS_ENDPOINTS } from './config';

// ===== Delegated Signing Types =====

export interface DelegatedSigningConfig {
  enabled: boolean;
  relyingParty: {
    id: string;
    name: string;
    origin: string;
  };
  allowedCredentialTypes: DelegatedCredentialType[];
  sessionTimeout: number; // in minutes
  recoveryEnabled: boolean;
  kycRequired: boolean;
}

export interface DelegatedCredential {
  id: string;
  type: DelegatedCredentialType;
  status: DelegatedCredentialStatus;
  publicKey: string;
  attestationType: string;
  authenticatorInfo: AuthenticatorInfo;
  metadata: CredentialMetadata;
  deviceInfo: DeviceInfo;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

export interface AuthenticatorInfo {
  aaguid: string;
  credentialId: string;
  counter: number;
  credentialBackedUp: boolean;
  credentialDeviceType: AuthenticatorDeviceType;
  transports: AuthenticatorTransport[];
  userVerification: UserVerificationRequirement;
}

export interface CredentialMetadata {
  name: string;
  description?: string;
  tags?: string[];
  userAgent: string;
  ipAddress?: string;
  geoLocation?: string;
  riskScore?: number;
}

export interface DeviceInfo {
  platform: string;
  browser: string;
  userAgent: string;
  fingerprint: string;
  trusted: boolean;
  enrolledAt: string;
}

export interface DelegatedSession {
  id: string;
  userId: string;
  credentialId: string;
  status: DelegatedSessionStatus;
  capabilities: SessionCapability[];
  restrictions: SessionRestriction[];
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionCapability {
  operation: string;
  resources: string[];
  conditions?: Record<string, any>;
}

export interface SessionRestriction {
  type: RestrictionType;
  value: string;
  operator: ComparisonOperator;
}

export interface RecoveryOptions {
  kycBased: boolean;
  recoveryKey: boolean;
  socialRecovery: boolean;
  adminRecovery: boolean;
  timelock: number; // hours before recovery can be initiated
}

export interface RecoveryProcess {
  id: string;
  userId: string;
  type: RecoveryType;
  status: RecoveryStatus;
  initiatedAt: string;
  completedAt?: string;
  verificationMethod: string;
  recoveryData?: Record<string, any>;
}

export enum DelegatedCredentialType {
  WebAuthn = 'WebAuthn',
  Passkey = 'Passkey',
  BiometricKey = 'BiometricKey',
  DeviceKey = 'DeviceKey',
  RecoveryKey = 'RecoveryKey'
}

export enum DelegatedCredentialStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Revoked = 'Revoked',
  Expired = 'Expired',
  Compromised = 'Compromised'
}

export enum AuthenticatorDeviceType {
  Platform = 'platform',
  CrossPlatform = 'cross-platform'
}

export enum AuthenticatorTransport {
  USB = 'usb',
  NFC = 'nfc',
  BLE = 'ble',
  Hybrid = 'hybrid',
  Internal = 'internal'
}

export enum UserVerificationRequirement {
  Required = 'required',
  Preferred = 'preferred',
  Discouraged = 'discouraged'
}

export enum DelegatedSessionStatus {
  Active = 'Active',
  Expired = 'Expired',
  Revoked = 'Revoked',
  Suspended = 'Suspended'
}

export enum RestrictionType {
  TimeWindow = 'TimeWindow',
  IPAddress = 'IPAddress',
  GeoLocation = 'GeoLocation',
  DeviceFingerprint = 'DeviceFingerprint',
  UserAgent = 'UserAgent'
}

export enum ComparisonOperator {
  Equal = 'eq',
  NotEqual = 'ne',
  In = 'in',
  NotIn = 'nin',
  Contains = 'contains'
}

export enum RecoveryType {
  KYC = 'KYC',
  RecoveryKey = 'RecoveryKey',
  SocialRecovery = 'SocialRecovery',
  AdminRecovery = 'AdminRecovery'
}

export enum RecoveryStatus {
  Initiated = 'Initiated',
  Pending = 'Pending',
  Verified = 'Verified',
  Completed = 'Completed',
  Failed = 'Failed',
  Expired = 'Expired'
}

// ===== DFNS Delegated Signing Manager Class =====

export class DfnsDelegatedSigningManager {
  private config: DfnsClientConfig;
  private authenticator: DfnsAuthenticator;
  private delegatedConfig: DelegatedSigningConfig;
  private activeSessions: Map<string, DelegatedSession> = new Map();

  constructor(config: DfnsClientConfig, authenticator?: DfnsAuthenticator) {
    this.config = config;
    this.authenticator = authenticator || new DfnsAuthenticator(config);
    
    // Initialize delegated signing configuration
    this.delegatedConfig = {
      enabled: true,
      relyingParty: {
        id: window.location.hostname,
        name: 'Chain Capital',
        origin: window.location.origin
      },
      allowedCredentialTypes: [
        DelegatedCredentialType.WebAuthn,
        DelegatedCredentialType.Passkey,
        DelegatedCredentialType.BiometricKey
      ],
      sessionTimeout: 60, // 1 hour
      recoveryEnabled: true,
      kycRequired: false
    };

    this.loadActiveSessions();
  }

  // ===== Credential Registration =====

  /**
   * Register a new WebAuthn credential for delegated signing
   */
  async registerWebAuthnCredential(
    username: string,
    displayName: string,
    credentialName: string
  ): Promise<DelegatedCredential> {
    if (!this.isWebAuthnSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    try {
      // Initiate registration challenge
      const challenge = await this.initiateRegistrationChallenge(username, credentialName);
      
      // Create WebAuthn credential
      const credentialCreationOptions: CredentialCreationOptions = {
        publicKey: {
          challenge: this.base64UrlDecode(challenge.challenge),
          rp: {
            id: this.delegatedConfig.relyingParty.id,
            name: this.delegatedConfig.relyingParty.name
          },
          user: {
            id: new TextEncoder().encode(username),
            name: username,
            displayName: displayName
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },  // ES256
            { alg: -257, type: 'public-key' } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'preferred',
            requireResidentKey: false
          },
          timeout: 60000,
          attestation: 'direct',
          excludeCredentials: challenge.excludeCredentials?.map(cred => ({
            id: this.base64UrlDecode(cred.id),
            type: 'public-key' as const,
            transports: cred.transports as AuthenticatorTransport[]
          }))
        }
      };

      const credential = await navigator.credentials.create(credentialCreationOptions) as PublicKeyCredential;
      
      if (!credential) {
        throw new Error('Failed to create WebAuthn credential');
      }

      // Process the credential
      const registrationResult = await this.processCredentialRegistration(credential, challenge);
      
      return registrationResult;
    } catch (error) {
      throw new Error(`WebAuthn credential registration failed: ${(error as Error).message}`);
    }
  }

  /**
   * Register a passkey for enhanced user experience
   */
  async registerPasskey(
    username: string,
    displayName: string
  ): Promise<DelegatedCredential> {
    try {
      // Check if passkeys are supported
      if (!this.isPasskeySupported()) {
        throw new Error('Passkeys are not supported in this browser');
      }

      // Create passkey with enhanced options
      const credentialCreationOptions: CredentialCreationOptions = {
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: {
            id: this.delegatedConfig.relyingParty.id,
            name: this.delegatedConfig.relyingParty.name
          },
          user: {
            id: new TextEncoder().encode(username),
            name: username,
            displayName: displayName
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' }
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'required',
            requireResidentKey: true
          },
          timeout: 60000,
          attestation: 'none' // Passkeys don't need attestation
        }
      };

      const credential = await navigator.credentials.create(credentialCreationOptions) as PublicKeyCredential;
      
      if (!credential) {
        throw new Error('Failed to create passkey');
      }

      // Register with DFNS
      const delegatedCredential = await this.registerCredentialWithDfns(
        credential,
        DelegatedCredentialType.Passkey,
        `${username}-passkey`
      );

      return delegatedCredential;
    } catch (error) {
      throw new Error(`Passkey registration failed: ${(error as Error).message}`);
    }
  }

  // ===== Authentication & Session Management =====

  /**
   * Authenticate user with delegated credentials
   */
  async authenticateWithDelegatedCredential(
    credentialId?: string
  ): Promise<DelegatedSession> {
    try {
      if (!this.isWebAuthnSupported()) {
        throw new Error('WebAuthn is not supported');
      }

      // Get authentication challenge
      const challenge = await this.getAuthenticationChallenge(credentialId);
      
      // Create authentication options
      const requestOptions: CredentialRequestOptions = {
        publicKey: {
          challenge: this.base64UrlDecode(challenge.challenge),
          allowCredentials: challenge.allowCredentials?.map(cred => ({
            id: this.base64UrlDecode(cred.id),
            type: 'public-key' as const,
            transports: cred.transports as AuthenticatorTransport[]
          })),
          userVerification: 'required',
          timeout: 60000
        }
      };

      const assertion = await navigator.credentials.get(requestOptions) as PublicKeyCredential;
      
      if (!assertion) {
        throw new Error('Authentication failed');
      }

      // Process authentication result
      const session = await this.processAuthentication(assertion, challenge);
      
      // Store session
      this.activeSessions.set(session.id, session);
      this.saveActiveSessions();
      
      return session;
    } catch (error) {
      throw new Error(`Delegated authentication failed: ${(error as Error).message}`);
    }
  }

  /**
   * Sign a user action with delegated credentials
   */
  async signUserActionDelegated(
    operation: string,
    data: any,
    sessionId?: string
  ): Promise<string> {
    try {
      const session = sessionId ? 
        this.activeSessions.get(sessionId) : 
        this.getMostRecentActiveSession();

      if (!session || !this.isSessionValid(session)) {
        throw new Error('Valid session required for delegated signing');
      }

      // Check if operation is allowed for this session
      if (!this.isOperationAllowed(session, operation)) {
        throw new Error(`Operation '${operation}' not allowed for this session`);
      }

      // Create signing challenge
      const challenge = await this.createUserActionChallenge(operation, data, session.credentialId);
      
      // Sign with WebAuthn
      const signature = await this.signWithWebAuthn(challenge);
      
      // Update session activity
      session.lastActivityAt = new Date().toISOString();
      this.activeSessions.set(session.id, session);
      this.saveActiveSessions();
      
      return signature;
    } catch (error) {
      throw new Error(`Delegated signing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Create a temporary session for specific operations
   */
  async createTemporarySession(
    credentialId: string,
    operations: string[],
    duration: number = 30 // minutes
  ): Promise<DelegatedSession> {
    const session: DelegatedSession = {
      id: this.generateSessionId(),
      userId: 'current', // Would be actual user ID in production
      credentialId,
      status: DelegatedSessionStatus.Active,
      capabilities: operations.map(op => ({
        operation: op,
        resources: ['*'],
        conditions: {}
      })),
      restrictions: [
        {
          type: RestrictionType.TimeWindow,
          value: new Date(Date.now() + duration * 60 * 1000).toISOString(),
          operator: ComparisonOperator.Equal
        }
      ],
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + duration * 60 * 1000).toISOString(),
      lastActivityAt: new Date().toISOString(),
      ipAddress: await this.getCurrentIPAddress(),
      userAgent: navigator.userAgent
    };

    this.activeSessions.set(session.id, session);
    this.saveActiveSessions();
    
    return session;
  }

  // ===== Recovery Management =====

  /**
   * Initiate account recovery process
   */
  async initiateRecovery(
    username: string,
    recoveryType: RecoveryType,
    verificationData?: any
  ): Promise<RecoveryProcess> {
    try {
      const recovery: RecoveryProcess = {
        id: this.generateRecoveryId(),
        userId: username,
        type: recoveryType,
        status: RecoveryStatus.Initiated,
        initiatedAt: new Date().toISOString(),
        verificationMethod: this.getVerificationMethod(recoveryType),
        recoveryData: verificationData
      };

      // Start recovery process based on type
      switch (recoveryType) {
        case RecoveryType.KYC:
          return await this.initiateKYCRecovery(recovery);
        case RecoveryType.RecoveryKey:
          return await this.initiateRecoveryKeyProcess(recovery);
        case RecoveryType.SocialRecovery:
          return await this.initiateSocialRecovery(recovery);
        case RecoveryType.AdminRecovery:
          return await this.initiateAdminRecovery(recovery);
        default:
          throw new Error(`Unsupported recovery type: ${recoveryType}`);
      }
    } catch (error) {
      throw new Error(`Recovery initiation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Complete recovery process and restore access
   */
  async completeRecovery(
    recoveryId: string,
    verificationProof: any
  ): Promise<DelegatedCredential> {
    try {
      // Verify recovery proof
      const isValid = await this.verifyRecoveryProof(recoveryId, verificationProof);
      
      if (!isValid) {
        throw new Error('Invalid recovery proof');
      }

      // Generate new credential for recovered account
      const newCredential = await this.generateRecoveryCredential(recoveryId);
      
      // Mark recovery as completed
      await this.markRecoveryCompleted(recoveryId);
      
      return newCredential;
    } catch (error) {
      throw new Error(`Recovery completion failed: ${(error as Error).message}`);
    }
  }

  // ===== Credential Management =====

  /**
   * List user's delegated credentials
   */
  async listDelegatedCredentials(userId: string): Promise<DelegatedCredential[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/delegated/credentials`, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to list credentials: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to list delegated credentials: ${(error as Error).message}`);
    }
  }

  /**
   * Revoke a delegated credential
   */
  async revokeDelegatedCredential(credentialId: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/delegated/credentials/${credentialId}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to revoke credential: ${response.statusText}`);
      }

      // Remove any active sessions using this credential
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (session.credentialId === credentialId) {
          this.activeSessions.delete(sessionId);
        }
      }
      
      this.saveActiveSessions();
    } catch (error) {
      throw new Error(`Failed to revoke delegated credential: ${(error as Error).message}`);
    }
  }

  /**
   * Update credential metadata
   */
  async updateCredentialMetadata(
    credentialId: string,
    metadata: Partial<CredentialMetadata>
  ): Promise<DelegatedCredential> {
    try {
      const response = await fetch(`${this.config.baseUrl}/delegated/credentials/${credentialId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(await this.getAuthHeaders())
        },
        body: JSON.stringify({ metadata })
      });

      if (!response.ok) {
        throw new Error(`Failed to update credential: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to update credential metadata: ${(error as Error).message}`);
    }
  }

  // ===== Session Management =====

  /**
   * Check if session is valid and active
   */
  private isSessionValid(session: DelegatedSession): boolean {
    if (session.status !== DelegatedSessionStatus.Active) {
      return false;
    }

    const now = Date.now();
    const expiresAt = new Date(session.expiresAt).getTime();
    
    if (now > expiresAt) {
      session.status = DelegatedSessionStatus.Expired;
      return false;
    }

    return true;
  }

  /**
   * Check if operation is allowed for session
   */
  private isOperationAllowed(session: DelegatedSession, operation: string): boolean {
    return session.capabilities.some(cap => 
      cap.operation === operation || cap.operation === '*'
    );
  }

  /**
   * Get most recent active session
   */
  private getMostRecentActiveSession(): DelegatedSession | null {
    let mostRecent: DelegatedSession | null = null;
    let mostRecentTime = 0;

    for (const session of this.activeSessions.values()) {
      if (this.isSessionValid(session)) {
        const activityTime = new Date(session.lastActivityAt).getTime();
        if (activityTime > mostRecentTime) {
          mostRecent = session;
          mostRecentTime = activityTime;
        }
      }
    }

    return mostRecent;
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const expiredSessions: string[] = [];
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (!this.isSessionValid(session)) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      this.activeSessions.delete(sessionId);
    }

    if (expiredSessions.length > 0) {
      this.saveActiveSessions();
    }
  }

  // ===== Utility Methods =====

  /**
   * Check if WebAuthn is supported
   */
  private isWebAuthnSupported(): boolean {
    return !!(navigator.credentials && navigator.credentials.create && navigator.credentials.get);
  }

  /**
   * Check if passkeys are supported
   */
  private isPasskeySupported(): boolean {
    return this.isWebAuthnSupported() && 
           'PublicKeyCredential' in window &&
           'isConditionalMediationAvailable' in PublicKeyCredential;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate recovery ID
   */
  private generateRecoveryId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Base64 URL decode
   */
  private base64UrlDecode(data: string): ArrayBuffer {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Load active sessions from storage
   */
  private loadActiveSessions(): void {
    if (typeof window === 'undefined' || !window.sessionStorage) return;

    try {
      const stored = sessionStorage.getItem('dfns_delegated_sessions');
      if (stored) {
        const sessions = JSON.parse(stored);
        this.activeSessions = new Map(Object.entries(sessions));
        this.cleanupExpiredSessions();
      }
    } catch (error) {
      console.warn('[DFNS Delegated] Failed to load sessions:', error);
    }
  }

  /**
   * Save active sessions to storage
   */
  private saveActiveSessions(): void {
    if (typeof window === 'undefined' || !window.sessionStorage) return;

    try {
      const sessions = Object.fromEntries(this.activeSessions);
      sessionStorage.setItem('dfns_delegated_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.warn('[DFNS Delegated] Failed to save sessions:', error);
    }
  }

  // ===== Placeholder Methods (to be implemented based on DFNS API) =====

  private async initiateRegistrationChallenge(username: string, credentialName: string): Promise<any> {
    // Implementation would call DFNS API
    throw new Error('Not implemented - requires DFNS API integration');
  }

  private async processCredentialRegistration(credential: PublicKeyCredential, challenge: any): Promise<DelegatedCredential> {
    // Implementation would process with DFNS API
    throw new Error('Not implemented - requires DFNS API integration');
  }

  private async registerCredentialWithDfns(credential: PublicKeyCredential, type: DelegatedCredentialType, name: string): Promise<DelegatedCredential> {
    // Implementation would register with DFNS API
    throw new Error('Not implemented - requires DFNS API integration');
  }

  private async getAuthenticationChallenge(credentialId?: string): Promise<any> {
    // Implementation would get challenge from DFNS API
    throw new Error('Not implemented - requires DFNS API integration');
  }

  private async processAuthentication(assertion: PublicKeyCredential, challenge: any): Promise<DelegatedSession> {
    // Implementation would process with DFNS API
    throw new Error('Not implemented - requires DFNS API integration');
  }

  private async createUserActionChallenge(operation: string, data: any, credentialId: string): Promise<any> {
    // Implementation would create challenge via DFNS API
    throw new Error('Not implemented - requires DFNS API integration');
  }

  private async signWithWebAuthn(challenge: any): Promise<string> {
    // Implementation would sign with WebAuthn
    throw new Error('Not implemented - requires DFNS API integration');
  }

  private async getCurrentIPAddress(): Promise<string> {
    // Implementation would get user's IP
    return 'unknown';
  }

  private getVerificationMethod(recoveryType: RecoveryType): string {
    switch (recoveryType) {
      case RecoveryType.KYC: return 'identity_verification';
      case RecoveryType.RecoveryKey: return 'recovery_key';
      case RecoveryType.SocialRecovery: return 'social_verification';
      case RecoveryType.AdminRecovery: return 'admin_approval';
      default: return 'unknown';
    }
  }

  private async initiateKYCRecovery(recovery: RecoveryProcess): Promise<RecoveryProcess> {
    // Implementation would integrate with KYC provider
    throw new Error('Not implemented - requires KYC integration');
  }

  private async initiateRecoveryKeyProcess(recovery: RecoveryProcess): Promise<RecoveryProcess> {
    // Implementation would handle recovery key verification
    throw new Error('Not implemented - requires recovery key system');
  }

  private async initiateSocialRecovery(recovery: RecoveryProcess): Promise<RecoveryProcess> {
    // Implementation would handle social recovery
    throw new Error('Not implemented - requires social recovery system');
  }

  private async initiateAdminRecovery(recovery: RecoveryProcess): Promise<RecoveryProcess> {
    // Implementation would handle admin recovery
    throw new Error('Not implemented - requires admin recovery system');
  }

  private async verifyRecoveryProof(recoveryId: string, proof: any): Promise<boolean> {
    // Implementation would verify recovery proof
    throw new Error('Not implemented - requires recovery verification');
  }

  private async generateRecoveryCredential(recoveryId: string): Promise<DelegatedCredential> {
    // Implementation would generate new credential
    throw new Error('Not implemented - requires credential generation');
  }

  private async markRecoveryCompleted(recoveryId: string): Promise<void> {
    // Implementation would mark recovery as completed
    throw new Error('Not implemented - requires recovery tracking');
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers = await this.authenticator.getAuthHeaders('GET', '/delegated');
    // Filter out undefined values and convert to Record<string, string>
    const filteredHeaders: Record<string, string> = {};
    Object.entries(headers).forEach(([key, value]) => {
      if (value !== undefined) {
        filteredHeaders[key] = value;
      }
    });
    return filteredHeaders;
  }
}

// ===== Export =====

export default DfnsDelegatedSigningManager;
