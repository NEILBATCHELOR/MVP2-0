/**
 * Central repository of model interfaces that match the database schema
 * Use these interfaces consistently across the application
 */

// User model
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "revoked" | "suspended";
  publicKey?: string;
  encryptedPrivateKey?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  mfa_enabled?: boolean;
}

// Project model
export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  projectType: string;
  tokenSymbol: string;
  targetRaise: number;
  authorizedShares: number;
  sharePrice: number;
  companyValuation?: number;
  fundingRound?: string;
  legalEntity?: string;
  jurisdiction?: string;
  taxId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Investor model
export interface Investor {
  id: string;
  name: string;
  email: string;
  company?: string;
  type: string;
  kycStatus?: string;
  kycExpiryDate?: Date | null;
  walletAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Investor with investment details
export interface InvestorWithDetails extends Investor {
  securityType: string;
  subscriptionAmount: number;
  tokenAllocation?: number;
  ownershipPercentage?: number;
  investmentDate?: string;
  conversionCap?: number;
  conversionDiscount?: number;
  interestRate?: number;
  maturityDate?: string;
  liquidationPreference?: number;
  participationMultiple?: number;
  converted?: boolean;
  conversionRound?: string;
  originalSecurityType?: string;
  status?: string;
  paymentStatus?: string;
  notes?: string;
  subscriptionId: string;
  participationAmount?: number;
  preferenceAmount?: number;
  commonDistribution?: number;
}

// Subscription model
export interface Subscription {
  id: string;
  investorId: string;
  investorName?: string;
  projectId: string;
  currency: string;
  fiatAmount: number;
  tokenAmount?: number;
  confirmed: boolean;
  allocated: boolean;
  distributed: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// RedemptionRequest model
export interface RedemptionRequest {
  id: string;
  requestDate: Date | string;
  tokenAmount: number;
  tokenType: string;
  redemptionType: string;
  status: string;
  sourceWalletAddress: string;
  destinationWalletAddress: string;
  conversionRate?: number;
  investorName: string;
  investorId: string;
  isBulkRedemption: boolean;
  investorCount: number;
  approvers: any[];
  requiredApprovals: number;
}

// Activity log model
export interface ActivityLog {
  id: string;
  timestamp: Date;
  action: string;
  userId: string;
  userEmail: string;
  entityType?: string;
  entityId?: string;
  details: string;
  status: string;
  projectId?: string;
} 