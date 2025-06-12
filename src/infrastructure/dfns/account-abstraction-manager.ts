/**
 * DFNS Account Abstraction Manager - ERC-4337 Smart Account implementation for DFNS
 * 
 * This service manages DFNS Account Abstraction (ERC-4337) features including:
 * - Smart account deployments and management
 * - Gasless transactions with paymasters
 * - User operation bundling and execution
 * - Account factory management
 * - Session key management for enhanced UX
 */

import type { DfnsClientConfig } from '@/types/dfns';
import { DfnsAuthenticator } from './auth';
import { DFNS_CONFIG, DFNS_ENDPOINTS } from './config';

// ===== Account Abstraction Types =====

export interface SmartAccount {
  id: string;
  address: string;
  walletId: string;
  factory: AccountFactory;
  implementation: string;
  owner: string;
  salt: string;
  initCode: string;
  status: AccountStatus;
  features: AccountFeatures;
  paymasters: PaymasterConfig[];
  sessionKeys: SessionKey[];
  metadata?: Record<string, any>;
  dateCreated: string;
  dateUpdated: string;
}

export interface AccountFactory {
  address: string;
  type: FactoryType;
  version: string;
  network: string;
  features: string[];
}

export interface AccountFeatures {
  multiSig: boolean;
  socialRecovery: boolean;
  spendingLimits: boolean;
  sessionKeys: boolean;
  gaslessTransactions: boolean;
  batchTransactions: boolean;
  scheduledTransactions: boolean;
  upgradeability: boolean;
}

export interface UserOperation {
  id: string;
  smartAccountId: string;
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
  status: UserOpStatus;
  bundleId?: string;
  txHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  actualGasCost?: string;
  dateCreated: string;
  dateExecuted?: string;
}

export interface PaymasterConfig {
  id: string;
  address: string;
  type: PaymasterType;
  name: string;
  supportedTokens: string[];
  policies: PaymasterPolicy[];
  status: PaymasterStatus;
  balance: string;
  dailyLimit: string;
  usedToday: string;
  metadata?: Record<string, any>;
}

export interface PaymasterPolicy {
  id: string;
  name: string;
  conditions: PolicyCondition[];
  limits: PolicyLimits;
  enabled: boolean;
}

export interface PolicyCondition {
  type: ConditionType;
  value: string;
  operator: ComparisonOperator;
}

export interface PolicyLimits {
  dailyLimit: string;
  perTransactionLimit: string;
  monthlyLimit: string;
  gasPrice: {
    min: string;
    max: string;
  };
}

export interface SessionKey {
  id: string;
  publicKey: string;
  permissions: SessionPermissions;
  restrictions: SessionRestrictions;
  status: SessionKeyStatus;
  expiresAt: string;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
}

export interface SessionPermissions {
  allowedMethods: string[];
  allowedTargets: string[];
  allowedTokens: string[];
  maxAmount: string;
  canDelegate: boolean;
}

export interface SessionRestrictions {
  timeWindow: {
    start: string;
    end: string;
  };
  usageLimit: number;
  rateLimit: {
    count: number;
    period: number; // seconds
  };
  ipWhitelist?: string[];
  geographicRestrictions?: string[];
}

export interface BatchTransaction {
  target: string;
  value: string;
  data: string;
  operation: OperationType;
}

export interface GasEstimate {
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterGas?: string;
  totalGasCost: string;
  totalGasCostUsd: string;
}

export interface AccountDeploymentConfig {
  walletId: string;
  factory: string;
  implementation?: string;
  salt?: string;
  initialOwner: string;
  features: Partial<AccountFeatures>;
  paymasters?: string[];
  sessionKeys?: Omit<SessionKey, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>[];
}

export enum AccountStatus {
  Deploying = 'Deploying',
  Active = 'Active',
  Paused = 'Paused',
  Upgrading = 'Upgrading',
  Deprecated = 'Deprecated'
}

export enum FactoryType {
  Safe = 'Safe',
  Biconomy = 'Biconomy',
  ZeroDev = 'ZeroDev',
  Alchemy = 'Alchemy',
  Custom = 'Custom'
}

export enum UserOpStatus {
  Pending = 'Pending',
  Bundled = 'Bundled',
  Submitted = 'Submitted',
  Included = 'Included',
  Executed = 'Executed',
  Failed = 'Failed',
  Rejected = 'Rejected'
}

export enum PaymasterType {
  Verifying = 'Verifying',
  DepositPaymaster = 'DepositPaymaster',
  TokenPaymaster = 'TokenPaymaster',
  SponsorshipPaymaster = 'SponsorshipPaymaster'
}

export enum PaymasterStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  OutOfFunds = 'OutOfFunds',
  Deprecated = 'Deprecated'
}

export enum SessionKeyStatus {
  Active = 'Active',
  Paused = 'Paused',
  Expired = 'Expired',
  Revoked = 'Revoked'
}

export enum ConditionType {
  ContractAddress = 'ContractAddress',
  FunctionSelector = 'FunctionSelector',
  Amount = 'Amount',
  Token = 'Token',
  TimeWindow = 'TimeWindow',
  GasPrice = 'GasPrice'
}

export enum ComparisonOperator {
  Equal = 'eq',
  NotEqual = 'ne',
  GreaterThan = 'gt',
  LessThan = 'lt',
  GreaterThanOrEqual = 'gte',
  LessThanOrEqual = 'lte',
  In = 'in',
  NotIn = 'nin'
}

export enum OperationType {
  Call = 0,
  DelegateCall = 1,
  Create = 2,
  Create2 = 3
}

// ===== DFNS Account Abstraction Manager Class =====

export class DfnsAccountAbstractionManager {
  private config: DfnsClientConfig;
  private authenticator: DfnsAuthenticator;

  constructor(config: DfnsClientConfig, authenticator?: DfnsAuthenticator) {
    this.config = config;
    this.authenticator = authenticator || new DfnsAuthenticator(config);
  }

  // ===== Smart Account Management =====

  /**
   * Deploy a new smart account
   */
  async deploySmartAccount(config: AccountDeploymentConfig): Promise<SmartAccount> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to deploy smart account');
      }

      // Validate deployment configuration
      this.validateDeploymentConfig(config);

      // Get user action signature for account deployment
      const userActionSignature = await this.authenticator.signUserAction(
        'POST',
        '/account-abstraction/smart-accounts',
        config
      );

      const response = await fetch(`${this.config.baseUrl}/account-abstraction/smart-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        },
        body: JSON.stringify({
          ...config,
          salt: config.salt || this.generateSalt(),
          initCode: await this.generateInitCode(config)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Smart account deployment failed: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to deploy smart account: ${(error as Error).message}`);
    }
  }

  /**
   * List smart accounts
   */
  async listSmartAccounts(filters?: {
    walletId?: string;
    status?: AccountStatus;
    factory?: string;
    limit?: number;
  }): Promise<SmartAccount[]> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to list smart accounts');
      }

      const queryParams = new URLSearchParams();
      if (filters?.walletId) queryParams.append('walletId', filters.walletId);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.factory) queryParams.append('factory', filters.factory);
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());

      const url = `${this.config.baseUrl}/account-abstraction/smart-accounts?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list smart accounts: ${response.statusText}`);
      }

      const data = await response.json();
      return data.accounts || [];
    } catch (error) {
      throw new Error(`Failed to list smart accounts: ${(error as Error).message}`);
    }
  }

  /**
   * Get smart account details
   */
  async getSmartAccount(accountId: string): Promise<SmartAccount> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to get smart account');
      }

      const response = await fetch(`${this.config.baseUrl}/account-abstraction/smart-accounts/${accountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get smart account: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get smart account: ${(error as Error).message}`);
    }
  }

  // ===== User Operations =====

  /**
   * Create and execute a user operation
   */
  async executeUserOperation(request: {
    smartAccountId: string;
    transactions: BatchTransaction[];
    paymaster?: string;
    gasPolicy?: {
      maxFeePerGas?: string;
      maxPriorityFeePerGas?: string;
      gasLimit?: string;
    };
    sessionKeyId?: string;
  }): Promise<UserOperation> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to execute user operation');
      }

      // Get smart account details
      const smartAccount = await this.getSmartAccount(request.smartAccountId);

      // Estimate gas for the operation
      const gasEstimate = await this.estimateUserOpGas({
        smartAccount: smartAccount.address,
        transactions: request.transactions,
        paymaster: request.paymaster
      });

      // Build user operation
      const userOp = await this.buildUserOperation({
        smartAccount,
        transactions: request.transactions,
        gasEstimate,
        paymaster: request.paymaster,
        sessionKeyId: request.sessionKeyId
      });

      // Submit user operation
      const userActionSignature = await this.authenticator.signUserAction(
        'POST',
        '/account-abstraction/user-operations',
        userOp
      );

      const response = await fetch(`${this.config.baseUrl}/account-abstraction/user-operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        },
        body: JSON.stringify(userOp)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`User operation execution failed: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to execute user operation: ${(error as Error).message}`);
    }
  }

  /**
   * Get user operation status
   */
  async getUserOperation(userOpId: string): Promise<UserOperation> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to get user operation');
      }

      const response = await fetch(`${this.config.baseUrl}/account-abstraction/user-operations/${userOpId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get user operation: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get user operation: ${(error as Error).message}`);
    }
  }

  /**
   * List user operations
   */
  async listUserOperations(filters?: {
    smartAccountId?: string;
    status?: UserOpStatus;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<UserOperation[]> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to list user operations');
      }

      const queryParams = new URLSearchParams();
      if (filters?.smartAccountId) queryParams.append('smartAccountId', filters.smartAccountId);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());

      const url = `${this.config.baseUrl}/account-abstraction/user-operations?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list user operations: ${response.statusText}`);
      }

      const data = await response.json();
      return data.operations || [];
    } catch (error) {
      throw new Error(`Failed to list user operations: ${(error as Error).message}`);
    }
  }

  // ===== Gas Estimation =====

  /**
   * Estimate gas for user operation
   */
  async estimateUserOpGas(request: {
    smartAccount: string;
    transactions: BatchTransaction[];
    paymaster?: string;
  }): Promise<GasEstimate> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to estimate gas');
      }

      const response = await fetch(`${this.config.baseUrl}/account-abstraction/estimate-gas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gas estimation failed: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to estimate gas: ${(error as Error).message}`);
    }
  }

  // ===== Session Key Management =====

  /**
   * Create session key for smart account
   */
  async createSessionKey(
    smartAccountId: string,
    sessionKey: Omit<SessionKey, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>
  ): Promise<SessionKey> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to create session key');
      }

      const userActionSignature = await this.authenticator.signUserAction(
        'POST',
        `/account-abstraction/smart-accounts/${smartAccountId}/session-keys`,
        sessionKey
      );

      const response = await fetch(`${this.config.baseUrl}/account-abstraction/smart-accounts/${smartAccountId}/session-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        },
        body: JSON.stringify(sessionKey)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Session key creation failed: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to create session key: ${(error as Error).message}`);
    }
  }

  /**
   * Revoke session key
   */
  async revokeSessionKey(smartAccountId: string, sessionKeyId: string): Promise<void> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to revoke session key');
      }

      const userActionSignature = await this.authenticator.signUserAction(
        'DELETE',
        `/account-abstraction/smart-accounts/${smartAccountId}/session-keys/${sessionKeyId}`
      );

      const response = await fetch(`${this.config.baseUrl}/account-abstraction/smart-accounts/${smartAccountId}/session-keys/${sessionKeyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Session key revocation failed: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Failed to revoke session key: ${(error as Error).message}`);
    }
  }

  // ===== Paymaster Management =====

  /**
   * Configure paymaster for smart account
   */
  async configurePaymaster(
    smartAccountId: string,
    paymaster: Omit<PaymasterConfig, 'id' | 'balance' | 'usedToday'>
  ): Promise<PaymasterConfig> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to configure paymaster');
      }

      const userActionSignature = await this.authenticator.signUserAction(
        'POST',
        `/account-abstraction/smart-accounts/${smartAccountId}/paymasters`,
        paymaster
      );

      const response = await fetch(`${this.config.baseUrl}/account-abstraction/smart-accounts/${smartAccountId}/paymasters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId,
          'X-DFNS-USERACTION': this.base64UrlEncode(JSON.stringify(userActionSignature))
        },
        body: JSON.stringify(paymaster)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Paymaster configuration failed: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to configure paymaster: ${(error as Error).message}`);
    }
  }

  // ===== Factory Management =====

  /**
   * List available account factories
   */
  async listAccountFactories(network: string): Promise<AccountFactory[]> {
    try {
      if (!this.authenticator.isAuthenticated()) {
        throw new Error('Authentication required to list account factories');
      }

      const response = await fetch(`${this.config.baseUrl}/account-abstraction/factories?network=${network}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authenticator.getAccessToken()}`,
          'X-DFNS-APPID': this.config.appId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list account factories: ${response.statusText}`);
      }

      const data = await response.json();
      return data.factories || [];
    } catch (error) {
      throw new Error(`Failed to list account factories: ${(error as Error).message}`);
    }
  }

  // ===== Utility Methods =====

  /**
   * Validate deployment configuration
   */
  private validateDeploymentConfig(config: AccountDeploymentConfig): void {
    if (!config.walletId) {
      throw new Error('Wallet ID is required');
    }

    if (!config.factory) {
      throw new Error('Factory address is required');
    }

    if (!config.initialOwner) {
      throw new Error('Initial owner is required');
    }

    // Validate Ethereum address format
    if (!config.initialOwner.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error('Invalid initial owner address format');
    }
  }

  /**
   * Generate random salt for account deployment
   */
  private generateSalt(): string {
    return '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate init code for account deployment
   */
  private async generateInitCode(config: AccountDeploymentConfig): Promise<string> {
    // In a real implementation, this would generate the actual init code
    // based on the factory and configuration
    return '0x' + '00'.repeat(32); // Placeholder
  }

  /**
   * Build user operation from request
   */
  private async buildUserOperation(request: {
    smartAccount: SmartAccount;
    transactions: BatchTransaction[];
    gasEstimate: GasEstimate;
    paymaster?: string;
    sessionKeyId?: string;
  }): Promise<Partial<UserOperation>> {
    // In a real implementation, this would build the complete user operation
    return {
      sender: request.smartAccount.address,
      nonce: '0', // Would get actual nonce
      initCode: '0x',
      callData: this.encodeTransactions(request.transactions),
      callGasLimit: request.gasEstimate.callGasLimit,
      verificationGasLimit: request.gasEstimate.verificationGasLimit,
      preVerificationGas: request.gasEstimate.preVerificationGas,
      maxFeePerGas: request.gasEstimate.maxFeePerGas,
      maxPriorityFeePerGas: request.gasEstimate.maxPriorityFeePerGas,
      paymasterAndData: request.paymaster || '0x',
      signature: '0x' // Would be generated based on session key or main key
    };
  }

  /**
   * Encode multiple transactions into callData
   */
  private encodeTransactions(transactions: BatchTransaction[]): string {
    // Simplified encoding - in reality would use proper ABI encoding
    return '0x' + transactions.map(tx => 
      tx.target.slice(2) + tx.value.slice(2).padStart(64, '0') + tx.data.slice(2)
    ).join('');
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

  // ===== Convenience Methods =====

  /**
   * Execute gasless transaction
   */
  async executeGaslessTransaction(
    smartAccountId: string,
    to: string,
    value: string,
    data: string,
    paymaster: string
  ): Promise<UserOperation> {
    return this.executeUserOperation({
      smartAccountId,
      transactions: [{
        target: to,
        value,
        data,
        operation: OperationType.Call
      }],
      paymaster
    });
  }

  /**
   * Execute batch transactions
   */
  async executeBatchTransactions(
    smartAccountId: string,
    transactions: BatchTransaction[],
    paymaster?: string
  ): Promise<UserOperation> {
    return this.executeUserOperation({
      smartAccountId,
      transactions,
      paymaster
    });
  }

  /**
   * Create temporary session key for dApp interaction
   */
  async createDAppSessionKey(
    smartAccountId: string,
    dAppAddress: string,
    permissions: {
      allowedMethods: string[];
      maxAmount: string;
      duration: number; // hours
    }
  ): Promise<SessionKey> {
    const expiresAt = new Date(Date.now() + permissions.duration * 60 * 60 * 1000).toISOString();
    
    return this.createSessionKey(smartAccountId, {
      publicKey: this.generateSessionKeyPair().publicKey,
      permissions: {
        allowedMethods: permissions.allowedMethods,
        allowedTargets: [dAppAddress],
        allowedTokens: [],
        maxAmount: permissions.maxAmount,
        canDelegate: false
      },
      restrictions: {
        timeWindow: {
          start: new Date().toISOString(),
          end: expiresAt
        },
        usageLimit: 1000,
        rateLimit: {
          count: 10,
          period: 60
        }
      },
      status: SessionKeyStatus.Active,
      expiresAt
    });
  }

  /**
   * Generate session key pair (simplified)
   */
  private generateSessionKeyPair(): { publicKey: string; privateKey: string } {
    // In a real implementation, would use proper cryptographic key generation
    const publicKey = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(64)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const privateKey = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return { publicKey, privateKey };
  }
}

// ===== Export =====

export default DfnsAccountAbstractionManager;
