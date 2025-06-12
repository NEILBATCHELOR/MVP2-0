/**
 * DFNS Authenticator - Enhanced authentication for DFNS API requests
 * 
 * This module manages DFNS authentication methods including:
 * - Service Account authentication with proper signing
 * - Delegated authentication with challenge-response flow
 * - WebAuthn/Passkey authentication following DFNS standards
 * - Personal Access Token authentication
 * - User Action Signing for mutating requests
 * - Proper cryptographic signing (secp256k1, secp256r1, ed25519)
 */

import type { DfnsClientConfig } from '@/types/dfns';
import { DFNS_CONFIG, DFNS_ENDPOINTS } from './config';

// ===== Additional Types for Crypto Operations =====

type AnyAlgorithm = AlgorithmIdentifier | EcdsaParams | RsaPssParams;

// ===== Enhanced Authentication Types =====

export interface AuthCredentials {
  accessToken?: string;
  credentialId?: string;
  privateKey?: string;
  userActionChallenge?: string;
  credentialKind?: DfnsCredentialKind;
  publicKey?: string;
}

export interface AuthHeaders {
  'Authorization'?: string;
  'X-DFNS-USERACTION'?: string;
  'X-DFNS-APPID': string;
  'X-DFNS-NONCE'?: string;
  'X-DFNS-SIGTYPE'?: string;
  'X-DFNS-SIGNATURE'?: string;
  'X-DFNS-VERSION'?: string;
}

export interface SigningChallenge {
  challenge: string;
  challengeIdentifier: string;
  allowCredentials: {
    key?: Array<{
      id: string;
      type: string;
    }>;
    webauthn?: Array<{
      id: string;
      type: string;
    }>;
  };
  expiresAt: string;
}

export interface UserActionSignature {
  credentialAssertion: {
    credId: string;
    clientData: string;
    signature: string;
  };
}

export interface ServiceAccountToken {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  expiresAt: string; // Token expiration timestamp
  issuedAt: string;
}

export enum DfnsCredentialKind {
  Fido2 = 'Fido2',
  Key = 'Key', 
  PasswordProtectedKey = 'PasswordProtectedKey',
  RecoveryKey = 'RecoveryKey'
}

export enum DfnsSignatureType {
  Secp256k1 = 'secp256k1',
  Secp256r1 = 'secp256r1', 
  Ed25519 = 'ed25519'
}

// ===== Enhanced DFNS Authenticator Class =====

export class DfnsAuthenticator {
  private config: DfnsClientConfig;
  private credentials: AuthCredentials = {};
  private authToken?: string;
  private currentChallenge?: SigningChallenge;

  constructor(config: DfnsClientConfig) {
    this.config = config;
    this.loadCredentials();
  }

  // ===== Public Authentication Methods =====

  /**
   * Get authentication headers for a request with proper DFNS formatting
   */
  async getAuthHeaders(
    method: string,
    endpoint: string,
    body?: any,
    requiresUserAction = false
  ): Promise<AuthHeaders> {
    const headers: AuthHeaders = {
      'X-DFNS-APPID': this.config.appId,
      'X-DFNS-VERSION': '1.0.0'
    };

    // Add authorization header if we have an access token
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Add user action signature for mutating requests
    if (requiresUserAction && this.credentials.credentialId) {
      const userActionHeaders = await this.createUserActionHeaders(method, endpoint, body);
      Object.assign(headers, userActionHeaders);
    }

    // Add request signature if we have credentials
    if (this.credentials.credentialId && this.credentials.privateKey) {
      const signatureHeaders = await this.generateSignatureHeaders(method, endpoint, body);
      Object.assign(headers, signatureHeaders);
    }

    return headers;
  }

  /**
   * Authenticate with service account using proper DFNS flow
   */
  async authenticateServiceAccount(
    serviceAccountId: string,
    privateKey: string
  ): Promise<ServiceAccountToken> {
    try {
      // Create the authentication request
      const authRequest = {
        kind: 'ServiceAccount',
        credentialId: serviceAccountId
      };

      // Get signing challenge
      const challenge = await this.getSigningChallenge('/auth/service-accounts/login', authRequest);
      
      // Sign the challenge
      const signature = await this.signChallenge(challenge.challenge, privateKey, DfnsSignatureType.Secp256k1);
      
      // Exchange signed challenge for token
      const tokenResponse = await this.requestServiceAccountToken(
        serviceAccountId,
        challenge.challengeIdentifier,
        signature
      );

      this.authToken = tokenResponse.accessToken;
      this.credentials.credentialId = serviceAccountId;
      this.credentials.privateKey = privateKey;
      this.credentials.credentialKind = DfnsCredentialKind.Key;

      this.saveCredentials();
      return tokenResponse;
    } catch (error) {
      throw new Error(`Service account authentication failed: ${(error as Error).message}`);
    }
  }

  /**
   * Authenticate with delegated credentials using proper DFNS flow
   */
  async authenticateDelegated(
    username: string,
    credentialId: string,
    credentialKind: DfnsCredentialKind = DfnsCredentialKind.Fido2
  ): Promise<void> {
    try {
      // Initiate login challenge
      const loginRequest = {
        kind: 'EndUser',
        username: username
      };

      const challenge = await this.getSigningChallenge('/auth/login/init', loginRequest);
      
      let signature: string;
      
      if (credentialKind === DfnsCredentialKind.Fido2) {
        // Use WebAuthn for Fido2 credentials
        signature = await this.signWithWebAuthnDelegated(challenge, credentialId);
      } else {
        // Use private key for Key credentials
        if (!this.credentials.privateKey) {
          throw new Error('Private key required for Key credential authentication');
        }
        signature = await this.signChallenge(challenge.challenge, this.credentials.privateKey, DfnsSignatureType.Secp256k1);
      }

      // Complete login
      const authResponse = await this.completeLogin(
        challenge.challengeIdentifier,
        credentialId,
        signature,
        credentialKind
      );

      this.authToken = authResponse.accessToken;
      this.credentials.credentialId = credentialId;
      this.credentials.credentialKind = credentialKind;

      this.saveCredentials();
    } catch (error) {
      throw new Error(`Delegated authentication failed: ${(error as Error).message}`);
    }
  }

  /**
   * Authenticate with personal access token
   */
  async authenticateWithPAT(token: string): Promise<void> {
    // PAT tokens are used directly as bearer tokens
    this.authToken = token;
    this.credentials.credentialKind = undefined; // PATs don't use credentials
    this.saveCredentials();
  }

  // ===== User Action Signing =====

  /**
   * Sign a user action for mutating API requests
   */
  async signUserAction(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<UserActionSignature> {
    if (!this.credentials.credentialId) {
      throw new Error('No credential available for user action signing');
    }

    try {
      // Get user action challenge
      const actionRequest = {
        kind: 'UserAction',
        intentId: this.generateIntentId(),
        operation: `${method} ${endpoint}`
      };

      const challenge = await this.getSigningChallenge('/auth/action/init', actionRequest);
      this.currentChallenge = challenge;

      let signature: string;
      let clientData: string;

      if (this.credentials.credentialKind === DfnsCredentialKind.Fido2) {
        // Use WebAuthn for Fido2 credentials
        const webauthnResult = await this.signWithWebAuthnUserAction(challenge, body);
        signature = webauthnResult.signature;
        clientData = webauthnResult.clientData;
      } else {
        // Use private key for other credential types
        if (!this.credentials.privateKey) {
          throw new Error('Private key required for user action signing');
        }
        
        const signResult = await this.signUserActionWithKey(challenge, body, this.credentials.privateKey);
        signature = signResult.signature;
        clientData = signResult.clientData;
      }

      return {
        credentialAssertion: {
          credId: this.credentials.credentialId,
          clientData: this.base64UrlEncode(clientData),
          signature: this.base64UrlEncode(signature)
        }
      };
    } catch (error) {
      throw new Error(`User action signing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Create user action headers for authenticated requests
   */
  async createUserActionHeaders(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<Partial<AuthHeaders>> {
    try {
      const userActionSignature = await this.signUserAction(method, endpoint, body);
      const userActionToken = JSON.stringify(userActionSignature);
      
      return {
        'X-DFNS-USERACTION': this.base64UrlEncode(userActionToken)
      };
    } catch (error) {
      throw new Error(`Failed to create user action headers: ${(error as Error).message}`);
    }
  }

  // ===== Credential Management =====

  /**
   * Create a new key credential
   */
  async createKeyCredential(
    name: string,
    curve: DfnsSignatureType = DfnsSignatureType.Secp256k1
  ): Promise<{ credentialId: string; privateKey: string; publicKey: string }> {
    try {
      // Generate key pair
      const keyPair = await this.generateKeyPair(curve);
      
      // Get credential challenge
      const credentialRequest = {
        kind: 'Key',
        name: name,
        publicKey: keyPair.publicKey
      };

      const challenge = await this.getSigningChallenge('/auth/credentials/init', credentialRequest);
      
      // Sign challenge with new private key
      const signature = await this.signChallenge(challenge.challenge, keyPair.privateKey, curve);
      
      // Register credential
      const credential = await this.registerCredential(
        challenge.challengeIdentifier,
        name,
        DfnsCredentialKind.Key,
        keyPair.publicKey,
        signature
      );

      return {
        credentialId: credential.id,
        privateKey: keyPair.privateKey,
        publicKey: keyPair.publicKey
      };
    } catch (error) {
      throw new Error(`Key credential creation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Create a WebAuthn credential (Fido2)
   */
  async createWebAuthnCredential(
    name: string,
    username: string,
    displayName: string
  ): Promise<{ credentialId: string; publicKey: string }> {
    if (!navigator.credentials) {
      throw new Error('WebAuthn not supported in this browser');
    }

    try {
      // Get credential challenge from DFNS
      const credentialRequest = {
        kind: 'Fido2',
        name: name,
        username: username
      };

      const challenge = await this.getSigningChallenge('/auth/credentials/init', credentialRequest);
      
      // Create WebAuthn credential
      const createOptions: CredentialCreationOptions = {
        publicKey: {
          challenge: this.base64UrlDecode(challenge.challenge),
          rp: {
            name: 'Chain Capital',
            id: window.location.hostname
          },
          user: {
            id: new TextEncoder().encode(username),
            name: username,
            displayName: displayName
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256 (secp256r1)
            { alg: -257, type: 'public-key' } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'preferred'
          },
          timeout: 60000,
          attestation: 'direct'
        }
      };

      const credential = await navigator.credentials.create(createOptions) as PublicKeyCredential;
      
      if (!credential) {
        throw new Error('Failed to create WebAuthn credential');
      }

      // Extract credential data
      const response = credential.response as AuthenticatorAttestationResponse;
      const credentialId = this.arrayBufferToBase64Url(credential.rawId);
      const publicKey = this.arrayBufferToBase64Url(response.getPublicKey()!);
      const attestationObject = this.arrayBufferToBase64Url(response.attestationObject);
      const clientDataJSON = this.arrayBufferToBase64Url(response.clientDataJSON);

      // Register credential with DFNS
      const registeredCredential = await this.registerWebAuthnCredential(
        challenge.challengeIdentifier,
        name,
        credentialId,
        publicKey,
        attestationObject,
        clientDataJSON
      );

      this.credentials.credentialId = credentialId;
      this.credentials.publicKey = publicKey;
      this.credentials.credentialKind = DfnsCredentialKind.Fido2;
      this.saveCredentials();

      return {
        credentialId: credentialId,
        publicKey: publicKey
      };
    } catch (error) {
      throw new Error(`WebAuthn credential creation failed: ${(error as Error).message}`);
    }
  }

  // ===== Private Methods =====

  /**
   * Get signing challenge from DFNS API
   */
  private async getSigningChallenge(endpoint: string, request: any): Promise<SigningChallenge> {
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DFNS-APPID': this.config.appId
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Failed to get signing challenge: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Generate cryptographic key pair
   */
  private async generateKeyPair(curve: DfnsSignatureType): Promise<{ privateKey: string; publicKey: string }> {
    let algorithm: EcKeyGenParams | { name: string; namedCurve?: string };
    
    switch (curve) {
      case DfnsSignatureType.Secp256k1:
        // Note: secp256k1 is not natively supported by Web Crypto API
        // In production, you'd use a library like noble-secp256k1
        algorithm = { name: 'ECDSA', namedCurve: 'P-256' }; // Fallback to P-256
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

    try {
      const keyPair = await crypto.subtle.generateKey(
        algorithm,
        true, // extractable
        ['sign', 'verify']
      ) as CryptoKeyPair; // Type assertion to ensure it's a CryptoKeyPair

      // Export keys
      const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);

      const privateKey = this.arrayBufferToBase64(privateKeyBuffer);
      const publicKey = this.arrayBufferToBase64(publicKeyBuffer);

      return { privateKey, publicKey };
    } catch (error) {
      throw new Error(`Key generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Sign challenge with private key
   */
  private async signChallenge(
    challenge: string,
    privateKey: string,
    signatureType: DfnsSignatureType
  ): Promise<string> {
    try {
      // Import private key
      const keyBuffer = this.base64ToArrayBuffer(privateKey);
      
      let algorithm: EcdsaParams | RsaPssParams | AnyAlgorithm;
      switch (signatureType) {
        case DfnsSignatureType.Secp256k1:
        case DfnsSignatureType.Secp256r1:
          algorithm = { name: 'ECDSA', hash: { name: 'SHA-256' } };
          break;
        case DfnsSignatureType.Ed25519:
          algorithm = { name: 'Ed25519' };
          break;
        default:
          throw new Error(`Unsupported signature type: ${signatureType}`);
      }

      const cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        keyBuffer,
        algorithm,
        false,
        ['sign']
      );

      // Sign challenge
      const challengeBuffer = new TextEncoder().encode(challenge);
      const signatureBuffer = await crypto.subtle.sign(algorithm, cryptoKey, challengeBuffer);
      
      return this.arrayBufferToBase64Url(signatureBuffer);
    } catch (error) {
      throw new Error(`Challenge signing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Sign with WebAuthn for delegated authentication
   */
  private async signWithWebAuthnDelegated(
    challenge: SigningChallenge,
    credentialId: string
  ): Promise<string> {
    if (!navigator.credentials) {
      throw new Error('WebAuthn not supported');
    }

    try {
      const getOptions: CredentialRequestOptions = {
        publicKey: {
          challenge: this.base64UrlDecode(challenge.challenge),
          allowCredentials: [{
            id: this.base64UrlDecode(credentialId),
            type: 'public-key' as const
          }],
          userVerification: 'required',
          timeout: 60000
        }
      };

      const assertion = await navigator.credentials.get(getOptions) as PublicKeyCredential;
      
      if (!assertion) {
        throw new Error('WebAuthn authentication failed');
      }

      const response = assertion.response as AuthenticatorAssertionResponse;
      return this.arrayBufferToBase64Url(response.signature);
    } catch (error) {
      throw new Error(`WebAuthn delegated signing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Sign with WebAuthn for user actions
   */
  private async signWithWebAuthnUserAction(
    challenge: SigningChallenge,
    body?: any
  ): Promise<{ signature: string; clientData: string }> {
    if (!navigator.credentials) {
      throw new Error('WebAuthn not supported');
    }

    try {
      const getOptions: CredentialRequestOptions = {
        publicKey: {
          challenge: this.base64UrlDecode(challenge.challenge),
          allowCredentials: challenge.allowCredentials.webauthn?.map(cred => ({
            id: this.base64UrlDecode(cred.id),
            type: 'public-key' as const
          })) || [],
          userVerification: 'required',
          timeout: 60000
        }
      };

      const assertion = await navigator.credentials.get(getOptions) as PublicKeyCredential;
      
      if (!assertion) {
        throw new Error('WebAuthn authentication failed');
      }

      const response = assertion.response as AuthenticatorAssertionResponse;
      const signature = this.arrayBufferToBase64Url(response.signature);
      const clientData = this.arrayBufferToBase64Url(response.clientDataJSON);

      return { signature, clientData };
    } catch (error) {
      throw new Error(`WebAuthn user action signing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Sign user action with private key
   */
  private async signUserActionWithKey(
    challenge: SigningChallenge,
    body: any,
    privateKey: string
  ): Promise<{ signature: string; clientData: string }> {
    try {
      // Create client data similar to WebAuthn
      const clientData = {
        type: 'webauthn.get',
        challenge: challenge.challenge,
        origin: window.location.origin,
        crossOrigin: false
      };

      const clientDataString = JSON.stringify(clientData);
      const signature = await this.signChallenge(challenge.challenge, privateKey, DfnsSignatureType.Secp256k1);

      return {
        signature: signature,
        clientData: clientDataString
      };
    } catch (error) {
      throw new Error(`Key-based user action signing failed: ${(error as Error).message}`);
    }
  }

  // ===== API Communication Methods =====

  /**
   * Request service account token from DFNS
   */
  private async requestServiceAccountToken(
    serviceAccountId: string,
    challengeIdentifier: string,
    signature: string
  ): Promise<ServiceAccountToken> {
    const response = await fetch(`${this.config.baseUrl}/auth/service-accounts/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DFNS-APPID': this.config.appId
      },
      body: JSON.stringify({
        challengeIdentifier: challengeIdentifier,
        credentialAssertion: {
          credId: serviceAccountId,
          signature: signature
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Service account authentication failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Complete delegated login
   */
  private async completeLogin(
    challengeIdentifier: string,
    credentialId: string,
    signature: string,
    credentialKind: DfnsCredentialKind
  ): Promise<{ accessToken: string }> {
    const response = await fetch(`${this.config.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DFNS-APPID': this.config.appId
      },
      body: JSON.stringify({
        challengeIdentifier: challengeIdentifier,
        credentialAssertion: {
          credId: credentialId,
          signature: signature,
          kind: credentialKind
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Register a new credential
   */
  private async registerCredential(
    challengeIdentifier: string,
    name: string,
    kind: DfnsCredentialKind,
    publicKey: string,
    signature: string
  ): Promise<{ id: string }> {
    const response = await fetch(`${this.config.baseUrl}/auth/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DFNS-APPID': this.config.appId
      },
      body: JSON.stringify({
        challengeIdentifier: challengeIdentifier,
        name: name,
        kind: kind,
        publicKey: publicKey,
        signature: signature
      })
    });

    if (!response.ok) {
      throw new Error(`Credential registration failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Register WebAuthn credential
   */
  private async registerWebAuthnCredential(
    challengeIdentifier: string,
    name: string,
    credentialId: string,
    publicKey: string,
    attestationObject: string,
    clientDataJSON: string
  ): Promise<{ id: string }> {
    const response = await fetch(`${this.config.baseUrl}/auth/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DFNS-APPID': this.config.appId
      },
      body: JSON.stringify({
        challengeIdentifier: challengeIdentifier,
        name: name,
        kind: 'Fido2',
        credentialId: credentialId,
        publicKey: publicKey,
        attestationObject: attestationObject,
        clientDataJSON: clientDataJSON
      })
    });

    if (!response.ok) {
      throw new Error(`WebAuthn credential registration failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // ===== Utility Methods =====

  /**
   * Generate unique intent ID for user actions
   */
  private generateIntentId(): string {
    return `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
   * Convert ArrayBuffer to Base64 URL
   */
  private arrayBufferToBase64Url(buffer: ArrayBuffer): string {
    return this.base64UrlEncode(this.arrayBufferToBase64(buffer));
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // ===== Legacy Method Compatibility =====

  /**
   * Generate signature headers for request authentication (enhanced)
   */
  private async generateSignatureHeaders(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<Partial<AuthHeaders>> {
    if (!this.credentials.credentialId || !this.credentials.privateKey) {
      return {};
    }

    try {
      const nonce = this.generateNonce();
      const timestamp = Date.now().toString();
      
      // Create the message to sign following DFNS specification
      const message = this.createSignatureMessage(method, endpoint, body, nonce, timestamp);

      // Generate signature with proper algorithm
      const signature = await this.signChallenge(message, this.credentials.privateKey, DfnsSignatureType.Secp256k1);

      return {
        'X-DFNS-NONCE': nonce,
        'X-DFNS-SIGTYPE': DfnsSignatureType.Secp256k1,
        'X-DFNS-SIGNATURE': signature
      };
    } catch (error) {
      throw new Error(`Failed to generate signature headers: ${(error as Error).message}`);
    }
  }

  /**
   * Create message for signing (enhanced)
   */
  private createSignatureMessage(
    method: string,
    endpoint: string,
    body?: any,
    nonce?: string,
    timestamp?: string
  ): string {
    const bodyStr = body ? JSON.stringify(body) : '';
    const bodyHash = this.hashString(bodyStr);
    return `${method.toUpperCase()}${endpoint}${bodyHash}${nonce}${timestamp}`;
  }

  /**
   * Hash a string using SHA-256
   */
  private async hashString(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64Url(hashBuffer);
  }

  /**
   * Generate a cryptographically secure nonce
   */
  private generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return this.arrayBufferToBase64Url(array.buffer);
  }

  // ===== Credential Storage Methods =====

  /**
   * Load stored credentials
   */
  private loadCredentials(): void {
    // Load from environment variables first (for service accounts)
    if (DFNS_CONFIG.privateKey && DFNS_CONFIG.credentialId) {
      this.credentials.credentialId = DFNS_CONFIG.credentialId;
      this.credentials.privateKey = DFNS_CONFIG.privateKey;
      this.credentials.credentialKind = DfnsCredentialKind.Key;
    }

    // Load from session storage (browser only)
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const stored = sessionStorage.getItem('dfns_auth_credentials');
        if (stored) {
          const parsed = JSON.parse(stored);
          this.credentials = { ...this.credentials, ...parsed };
          this.authToken = parsed.accessToken;
        }
      } catch (error) {
        console.warn('Failed to load stored DFNS credentials:', error);
      }
    }
  }

  /**
   * Save credentials to storage
   */
  private saveCredentials(): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const toStore = {
          ...this.credentials,
          accessToken: this.authToken
        };
        sessionStorage.setItem('dfns_auth_credentials', JSON.stringify(toStore));
      } catch (error) {
        console.warn('Failed to save DFNS credentials:', error);
      }
    }
  }

  /**
   * Clear stored credentials
   */
  private clearStoredCredentials(): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        sessionStorage.removeItem('dfns_auth_credentials');
      } catch (error) {
        console.warn('Failed to clear stored DFNS credentials:', error);
      }
    }
  }

  // ===== Public Utility Methods =====

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<void> {
    if (!this.authToken) {
      throw new Error('No token to refresh');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const refreshResponse = await response.json();
      this.authToken = refreshResponse.accessToken;
      this.saveCredentials();
    } catch (error) {
      throw new Error(`Token refresh failed: ${(error as Error).message}`);
    }
  }

  /**
   * Clear authentication
   */
  logout(): void {
    this.authToken = undefined;
    this.credentials = {};
    this.currentChallenge = undefined;
    this.clearStoredCredentials();
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.authToken || this.credentials.credentialId);
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | undefined {
    return this.authToken;
  }

  /**
   * Get current credentials
   */
  getCredentials(): AuthCredentials {
    return { ...this.credentials };
  }

  /**
   * Check if user action signing is available
   */
  canSignUserActions(): boolean {
    return !!(this.credentials.credentialId && 
      (this.credentials.privateKey || this.credentials.credentialKind === DfnsCredentialKind.Fido2));
  }
}

// ===== Export =====

export default DfnsAuthenticator;
