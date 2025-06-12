import { ethers, type Provider } from 'ethers';

/**
 * Types for ONCHAINID digital identity integration
 */

export interface ClaimData {
  id?: string;
  topic: string | number;
  scheme: number;
  issuer: string;
  signature: string;
  data: string;
  uri?: string;
  validFrom?: number;
  validTo?: number;
  status?: 'VALID' | 'INVALID' | 'EXPIRED' | 'REVOKED';
}

export interface KeyData {
  key: string;
  purpose: number;
  keyType: number;
  status?: 'ADDED' | 'REMOVED';
}

export interface DigitalIdentityData {
  address: string;
  keys: KeyData[];
  claims: ClaimData[];
  implementationAuthority?: string;
  lastUpdate?: Date;
}

export interface ClaimOptions {
  topic: string | number;
  scheme?: number;
  validFrom?: Date;
  validTo?: Date;
  uri?: string;
}

export interface IdentityVerificationResult {
  address: string;
  isValid: boolean;
  identity?: DigitalIdentityData;
  reason?: string;
  verifiedBy?: string;
  timestamp: Date;
}

export enum KeyPurpose {
  MANAGEMENT = 1,
  ACTION = 2,
  CLAIM = 3,
  ENCRYPTION = 4,
  DELEGATE = 5
}

export enum KeyType {
  ECDSA = 1,
  RSA = 2,
  DELEGATE = 3
}

export enum ClaimTopic {
  EMPTY = 0,
  IDENTITY = 1,
  KYC = 2,
  AML = 3,
  ACCREDITED = 4,
  INVESTOR = 5,
  ELIGIBLE = 6,
  NATIONALITY = 7,
  TAX_RESIDENCY = 8,
  COMPANY_INCORPORATION = 9
}

export enum ClaimScheme {
  ECDSA = 1,
  RSA = 2,
  ERC1654 = 3
}

export interface IdentityDeployOptions {
  implementationAuthority?: string;
  managementKey?: string;
  factory?: string;
  gatewayAddress?: string;
  salt?: string;
}

export interface DeployedIdentity {
  address: string;
  owner: string;
  deployTx: ethers.ContractTransaction;
}

export interface ClaimVerificationResult {
  isValid: boolean;
  expirationDate?: Date;
  reason?: string;
}

export interface IdentityProviderConfig {
  network: string;
  gatewayAddress?: string;
  factoryAddress?: string;
  implementationAuthorityAddress?: string;
  rpcUrl?: string;
}

export interface IdentityServiceOptions {
  provider?:  Provider;
  signer?: ethers.Signer;
  networkId?: number;
  config?: IdentityProviderConfig;
} 