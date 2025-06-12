import { Tables, Json } from "@/types/core/database";
import { BaseModel } from "@/types/core/centralModels";

export enum PoolType {
  TOTAL_POOL = "Total Pool",
  TRANCHE = "Tranche"
}

export interface Provider {
  id: number;
  name: string;
  address: string;
}

export interface Payer {
  id: number;
  name: string;
}

export interface Pool extends BaseModel {
  id: string;
  poolName: string;
  poolType: PoolType;
  totalValue?: number;
  invoiceCount?: number;
  averageAge?: number;
  averageDiscountRate?: number;
  creationTimestamp: string;
}

export interface Invoice extends BaseModel {
  id: string;
  providerId: number;
  providerName?: string;
  patientName: string;
  patientDob: string;
  serviceDates: string;
  procedureCodes: string;
  diagnosisCodes: string;
  billedAmount: number;
  adjustments: number;
  netAmountDue: number;
  payerId: number;
  payerName?: string;
  policyNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  factoringDiscountRate: number;
  factoringTerms: string;
  uploadTimestamp: string;
  poolId?: string;
  poolName?: string;
}

export interface FactoringToken extends BaseModel {
  id: string;
  poolId: string | number;
  tokenName: string;
  tokenSymbol: string;
  totalTokens: number;
  tokenValue: number;
  totalValue: number;
  createdAt: string;
  status: 'draft' | 'active' | 'distributed' | 'under_review' | 'approved' | 'ready_to_mint' | 'minted' | 'deployed' | 'paused' | 'rejected';
  securityInterestDetails: string;
  projectId: string;
  averageAge?: number;
  discountedValue?: number;
  discountAmount?: number;
  averageDiscountRate?: number;
  metadata?: any;
  tokenType?: string;
}

export interface TokenAllocation extends BaseModel {
  id: string;
  investorId: string;
  investorName: string;
  tokenId: string;
  tokenName: string;
  tokenAmount: number;
  allocationDate: string;
  distributionStatus: 'pending' | 'completed';
  distributionDate?: string;
  transactionHash?: string;
  tokenType?: string;
  createdAt: string;
  notes?: string;
}

// Database table types from Supabase
export type ProviderTable = Tables<"provider">;
export type PayerTable = Tables<"payer">;
export type PoolTable = Tables<"pool">;
export type InvoiceTable = Tables<"invoice">;

// Form types for invoice uploading
export interface InvoiceFormData {
  providerName: string;
  providerAddress: string;
  patientName: string;
  patientDob: string;
  serviceDates: string;
  procedureCodes: string;
  diagnosisCodes: string;
  billedAmount: number;
  adjustments: number;
  netAmountDue: number;
  payerName: string;
  policyNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  factoringDiscountRate: number;
  factoringTerms: string;
}

// Types for CSV import
export interface InvoiceCsvRow {
  provider_name: string;
  provider_address: string;
  patient_name: string;
  patient_dob: string;
  service_dates: string;
  procedure_codes: string;
  diagnosis_codes: string;
  billed_amount: string;
  adjustments: string;
  net_amount_due: string;
  payer_name: string;
  policy_number: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  factoring_discount_rate: string;
  factoring_terms: string;
}

// Type for invoice validation error
export interface InvoiceValidationError {
  rowIndex: number;
  fieldName: string;
  errorMessage: string;
}

// Type for pool creation form
export interface PoolFormData {
  poolName: string;
  poolType: PoolType;
  invoiceIds: string[];
}

// Type for tokenization form
export interface TokenFormData {
  poolId: string;
  tokenName: string;
  tokenSymbol: string;
  totalTokens: number;
  initialTokenValue: number;
  securityInterestDetails: string;
}

// Type for token distribution form
export interface TokenDistributionFormData {
  tokenId: string;
  investorId: string;
  tokenAmount: number;
  investmentAmount?: number; // Amount in $ the investor is investing (discounted)
  discountRate?: number; // Discount rate for this allocation
}

// Type for tokenization form data
export interface TokenizationFormData {
  poolId: string;
  tokenName: string;
  tokenSymbol: string;
  totalTokens: number;
  tokenValue: number;
  securityInterestDetails: string;
  averageDuration?: number;
}