/**
 * Database Types - Core database-related type definitions
 * 
 * This file re-exports types from the Supabase-generated types
 * and provides additional custom database tables/types.
 */

import type { Json, Database } from './supabase';
export type { Database, Json } from './supabase';

// Helper types for Supabase - Re-exported from supabase.ts
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Export Enum types from Supabase
export type DocumentType = Database["public"]["Enums"]["document_type"];
export type DocumentStatus = Database["public"]["Enums"]["document_status"];
export type WorkflowStatus = Database["public"]["Enums"]["workflow_status"];
export type ComplianceStatus = Database["public"]["Enums"]["compliance_status"];

// Policy-related table exports
export type PolicyTemplateInsert = InsertTables<'policy_templates'>;
export type PolicyTemplateUpdate = UpdateTables<'policy_templates'>;
export type PolicyTemplateApproverInsert = InsertTables<'policy_template_approvers'>;

// Transaction types for blockchain operations
export type BlockchainTransactionInsert = InsertTables<'wallet_transactions'>;
export type BlockchainTransactionUpdate = UpdateTables<'wallet_transactions'>;
export type TransactionNotificationInsert = InsertTables<'transaction_notifications'>;
export type TransactionNotificationUpdate = UpdateTables<'transaction_notifications'>;

// Add these types to your transactions, ripple, moonpay

export interface TransactionTable {
  id: string;
  transaction_hash: string;
  from_address: string;
  to_address: string;
  value: number;
  token_symbol?: string;
  token_address?: string;
  blockchain: string;
  status: 'pending' | 'confirmed' | 'failed';
  type: 'transfer' | 'token_transfer' | 'nft_transfer';
  gas_used?: number;
  gas_limit?: number;
  gas_price?: number;
  max_fee_per_gas?: number;
  max_priority_fee_per_gas?: number;
  block_number?: number;
  block_hash?: string;
  transaction_index?: number;
  confirmations: number;
  memo?: string;
  destination_tag?: number;
  transfer_type: 'standard' | 'token' | 'nft' | 'multisig';
  network_fee?: number;
  estimated_confirmation_time?: string; // interval as string
  created_at: string;
  updated_at: string;
}

export interface RipplePaymentTable {
  id: string;
  hash: string;
  from_account: string;
  to_account: string;
  amount: number;
  currency: string;
  fee: number;
  status: 'pending' | 'validated' | 'failed';
  ledger_index?: number;
  sequence_number?: number;
  destination_tag?: number;
  source_tag?: number;
  memo?: string;
  payment_type: 'standard' | 'cross_border' | 'domestic';
  from_country?: string;
  to_country?: string;
  exchange_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface MoonpayTransactionTable {
  id: string;
  external_transaction_id?: string;
  type: 'buy' | 'sell';
  status: 'pending' | 'completed' | 'failed' | 'waitingPayment' | 'waitingAuthorization';
  crypto_currency: string;
  fiat_currency: string;
  crypto_amount?: number;
  fiat_amount: number;
  wallet_address?: string;
  payment_method?: string;
  customer_id?: string;
  redirect_url?: string;
  widget_redirect_url?: string;
  fees?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TransferHistoryView {
  id: string;
  hash: string;
  from_address: string;
  to_address: string;
  amount: number;
  asset?: string;
  blockchain: string;
  status: string;
  transfer_type: string;
  network_fee?: number;
  gas_used?: number;
  block_number?: number;
  confirmations: number;
  memo?: string;
  created_at: string;
  updated_at: string;
}

// Insert/Update types
export type TransactionInsert = Omit<TransactionTable, 'id' | 'created_at' | 'updated_at'>;
export type TransactionUpdate = Partial<TransactionInsert>;

export type RipplePaymentInsert = Omit<RipplePaymentTable, 'id' | 'created_at' | 'updated_at'>;
export type RipplePaymentUpdate = Partial<RipplePaymentInsert>;

export type MoonpayTransactionInsert = Omit<MoonpayTransactionTable, 'id' | 'created_at' | 'updated_at'>;
export type MoonpayTransactionUpdate = Partial<MoonpayTransactionInsert>;

// Domain types for @/types/centralModels.ts
export interface Transaction {
  id: string;
  transactionHash: string;
  fromAddress: string;
  toAddress: string;
  value: number;
  tokenSymbol?: string;
  tokenAddress?: string;
  blockchain: string;
  status: 'pending' | 'confirmed' | 'failed';
  type: 'transfer' | 'token_transfer' | 'nft_transfer';
  gasUsed?: number;
  gasLimit?: number;
  gasPrice?: number;
  maxFeePerGas?: number;
  maxPriorityFeePerGas?: number;
  blockNumber?: number;
  blockHash?: string;
  transactionIndex?: number;
  confirmations: number;
  memo?: string;
  destinationTag?: number;
  transferType: 'standard' | 'token' | 'nft' | 'multisig';
  networkFee?: number;
  estimatedConfirmationTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RipplePayment {
  id: string;
  hash: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency: string;
  fee: number;
  status: 'pending' | 'validated' | 'failed';
  ledgerIndex?: number;
  sequenceNumber?: number;
  destinationTag?: number;
  sourceTag?: number;
  memo?: string;
  paymentType: 'standard' | 'cross_border' | 'domestic';
  fromCountry?: string;
  toCountry?: string;
  exchangeRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MoonpayTransaction {
  id: string;
  externalTransactionId?: string;
  type: 'buy' | 'sell';
  status: 'pending' | 'completed' | 'failed' | 'waitingPayment' | 'waitingAuthorization';
  cryptoCurrency: string;
  fiatCurrency: string;
  cryptoAmount?: number;
  fiatAmount: number;
  walletAddress?: string;
  paymentMethod?: string;
  customerId?: string;
  redirectUrl?: string;
  widgetRedirectUrl?: string;
  fees?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ONCHAINID table exports
export interface OnchainIdentityTable {
  id: string;
  user_id: string;
  identity_address: string;
  blockchain: string;
  network: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface OnchainIssuerTable {
  id: string;
  issuer_address: string;
  issuer_name: string;
  blockchain: string;
  network: string;
  trusted_for_claims: number[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface OnchainClaimTable {
  id: string;
  identity_id: string;
  issuer_id: string;
  topic: number;
  data: string | null;
  signature: string;
  valid_from: string | null;
  valid_to: string | null;
  verification_timestamp: string;
  status: 'VALID' | 'INVALID' | 'EXPIRED' | 'REVOKED';
}

export interface OnchainVerificationHistoryTable {
  id: string;
  identity_id: string;
  verification_type: string;
  required_claims: number[];
  result: boolean;
  reason: string | null;
  verification_timestamp: string;
}

// Insert and Update types for ONCHAINID tables
export type OnchainIdentityInsert = Omit<OnchainIdentityTable, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type OnchainIdentityUpdate = Partial<Omit<OnchainIdentityTable, 'id' | 'created_at' | 'updated_at'>>;

export type OnchainIssuerInsert = Omit<OnchainIssuerTable, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type OnchainIssuerUpdate = Partial<Omit<OnchainIssuerTable, 'id' | 'created_at' | 'updated_at'>>;

export type OnchainClaimInsert = Omit<OnchainClaimTable, 'id' | 'verification_timestamp'> & { id?: string };
export type OnchainClaimUpdate = Partial<Omit<OnchainClaimTable, 'id' | 'verification_timestamp'>>;

export type OnchainVerificationHistoryInsert = Omit<OnchainVerificationHistoryTable, 'id' | 'verification_timestamp'> & { id?: string };

// Insert type exports
export type RedemptionRequestInsert = InsertTables<'redemption_requests'>;
export type RedemptionApproverInsert = InsertTables<'redemption_approvers'>;
export type OrganizationInsert = InsertTables<'organizations'>;
export type OrganizationUpdate = UpdateTables<'organizations'>;
export type InvestorInsert = InsertTables<'investors'>;
export type InvestorUpdate = UpdateTables<'investors'>;
export type InvestorApprovalInsert = InsertTables<'investor_approvals'>;
export type InvestorApprovalUpdate = UpdateTables<'investor_approvals'>;
export type IssuerDetailDocumentInsert = InsertTables<'issuer_detail_documents'>;
export type IssuerDetailDocumentUpdate = UpdateTables<'issuer_detail_documents'>;

// Template types for reuse in TokenTemplate related files
export type TokenTemplateInsert = InsertTables<'token_templates'>;
export type TokenTemplateUpdate = UpdateTables<'token_templates'>;

// Token-related insert/update types
export type TokenInsert = InsertTables<'tokens'>;
export type TokenUpdate = UpdateTables<'tokens'>;
export type TokenVersionInsert = InsertTables<'token_versions'>;
export type TokenVersionUpdate = UpdateTables<'token_versions'>;
export type TokenDeploymentInsert = InsertTables<'token_deployments'>;
export type TokenDeploymentUpdate = UpdateTables<'token_deployments'>;
export type TokenOperationInsert = InsertTables<'token_operations'>;
export type TokenOperationUpdate = UpdateTables<'token_operations'>;
export type TokenDesignInsert = InsertTables<'token_designs'>;
export type TokenDesignUpdate = UpdateTables<'token_designs'>;
export type TokenAllocationInsert = InsertTables<'token_allocations'>;
export type TokenAllocationUpdate = UpdateTables<'token_allocations'>;

// Risk Assessment types
export type RiskAssessmentInsert = InsertTables<'risk_assessments'>;
export type RiskAssessmentUpdate = UpdateTables<'risk_assessments'>;
export type RiskAssessmentTable = Tables<'risk_assessments'>;

// Add missing table type definitions
export type PolicyTemplatesTable = Tables<'policy_templates'>;
export type PolicyTemplateApproversTable = Tables<'policy_template_approvers'>;
export type UsersTable = Tables<'users'>;
export type RolesTable = Tables<'roles'>;
export type SubscriptionsTable = Tables<'subscriptions'>;
export type RedemptionRequestsTable = Tables<'redemption_requests'>;
export type RedemptionApproversTable = Tables<'redemption_approvers'>;
export type TokenAllocationsTable = Tables<'token_allocations'> & {
  linked_token_id?: string;
};
export type TokensTable = Tables<'tokens'>;
export type TokenVersionsTable = Tables<'token_versions'>;
export type TokenDeploymentsTable = Tables<'token_deployments'>;
export type TokenOperationsTable = Tables<'token_operations'>;
export type TokenDesignsTable = Tables<'token_designs'>;
export type TokenTemplatesTable = Tables<'token_templates'>;
export type IssuerDocumentsTable = Tables<'issuer_documents'>;
export type IssuerDetailDocumentsTable = Tables<'issuer_detail_documents'> & {
  is_public?: boolean;
};
export type OrganizationsTable = Tables<'organizations'>;
export type InvestorsTable = Tables<'investors'>;
export type InvestorApprovalsTable = Tables<'investor_approvals'>;
export type DistributionsTable = Tables<'distributions'>;
export type DistributionRedemptionsTable = Tables<'distribution_redemptions'>;
export type TokenErc20PropertiesTable = Tables<'token_erc20_properties'>;
export type TokenErc721PropertiesTable = Tables<'token_erc721_properties'>;
export type TokenErc721AttributesTable = Tables<'token_erc721_attributes'>;
export type TokenErc1155PropertiesTable = Tables<'token_erc1155_properties'> & {
  dynamic_uri_config?: Json;
  transfer_restrictions?: Json;
  container_config?: Json;
  dynamic_uris?: boolean;
  batch_minting_config?: Json;
};
export type TokenErc1155TypesTable = Tables<'token_erc1155_types'> & {
  fungibility_type?: 'fungible' | 'non-fungible' | 'semi-fungible';
};
export type TokenErc1155BalancesTable = Tables<'token_erc1155_balances'>;
export type TokenErc1155UriMappingsTable = Tables<'token_erc1155_uri_mappings'>;
export type TokenErc1400PropertiesTable = Tables<'token_erc1400_properties'> & {
  regulation_type?: string;
  is_multi_class?: boolean;
  tranche_transferability?: boolean;
  token_details?: string;
  legal_terms?: string;
  prospectus?: string;
  enforce_kyc?: boolean;
  forced_redemption_enabled?: boolean;
  whitelist_enabled?: boolean;
  holding_period?: number;
  max_investor_count?: number;
  investor_accreditation?: boolean;
  auto_compliance?: boolean;
  manual_approvals?: boolean;
  compliance_module?: string;
  is_issuable?: boolean;
  granular_control?: boolean;
  dividend_distribution?: boolean;
  corporate_actions?: boolean;
  custom_features?: Json;
  transfer_restrictions?: Json;
  issuance_modules?: boolean;
  recovery_mechanism?: boolean;
};
export type TokenErc1400ControllersTable = Tables<'token_erc1400_controllers'>;
export type TokenErc3525PropertiesTable = Tables<'token_erc3525_properties'> & {
  // Only include properties that exist in the actual database table
  // Based on our database schema query
  slot_approvals?: boolean;
  value_approvals?: boolean;
  updatable_slots?: boolean;
  value_transfers_enabled?: boolean;
  mergable?: boolean;
  splittable?: boolean;
  updatable_values?: boolean;
  slot_transfer_validation?: Json;
  dynamic_metadata?: boolean;
  allows_slot_enumeration?: boolean;
  value_aggregation?: boolean;
  permissioning_enabled?: boolean;
  supply_tracking?: boolean;
  custom_extensions?: string;
  fractionalizable?: boolean;
  metadata?: Json;
  fractionalization?: Json;
  transfer_restrictions?: Json;
  slot_transferability?: boolean;
  supports_enumeration?: boolean;
  fractional_transfers?: boolean;
  supports_approval_for_all?: boolean;
  is_mintable?: boolean;
  financial_instrument?: string;
  derivative_terms?: Json;
};
export type TokenErc3525SlotsTable = Tables<'token_erc3525_slots'>;
export type TokenErc3525AllocationsTable = Tables<'token_erc3525_allocations'> & {
  linked_token_id?: string;
  token_unit_id?: string; // Alias for token_id_within_slot
};
export type TokenErc4626PropertiesTable = Tables<'token_erc4626_properties'> & {
  // Add necessary fields from the database schema
  name?: string;
  symbol?: string;
  description?: string;
  decimals?: number;
  asset_token_address?: string; // Alias for asset_address
  asset_token_type?: string;
  vault_share_decimals?: number;
  initial_exchange_rate?: string;
  minimum_deposit?: string; // Alias for min_deposit
  maximum_deposit?: string; // Alias for max_deposit
  maximum_withdrawal?: string; // Alias for max_withdrawal
  maximum_redemption?: string;
  enable_fees?: boolean;
  fee_percentage?: string;
  fee_recipient?: string;
  deposit_fee?: string; // Confirmed as text in database
  withdrawal_fee?: string; // Confirmed as text in database
  performance_fee?: string; // Confirmed as text in database
  performance_fee_percentage?: string;
  deposit_fee_percentage?: string;
  withdrawal_fee_percentage?: string;
  strategy_params?: Json;
  strategy_type?: string;
  strategy_description?: string;
  yield_strategy?: Json | string;
  expected_apy?: string;
  rebalancing_frequency?: string;
  compound_integration?: boolean;
  aave_integration?: boolean;
  uniswap_integration?: boolean;
  curve_integration?: boolean;
  access_control_model?: string;
  enable_allowlist?: boolean;
  custom_hooks?: boolean;
  auto_reporting?: boolean;
  preview_functions?: boolean;
  limit_functions?: boolean;
  has_deposit_fee?: boolean;
  has_withdrawal_fee?: boolean;
  has_performance_fee?: boolean;
  has_custom_strategy?: boolean;
  withdrawal_rules?: Json;
};
export type TokenErc4626StrategyParamsTable = Tables<'token_erc4626_strategy_params'>;
export type TokenErc4626AssetAllocationsTable = Tables<'token_erc4626_asset_allocations'> & {
  asset_address?: string; // Alias for asset
  allocation?: string; // Alias for percentage
  strategy?: string;
};
export type WalletTransactionsTable = Tables<'wallet_transactions'>;
export type TransactionNotificationsTable = Tables<'transaction_notifications'>;

// Custom token interface that consolidates the core token table with extended properties
export interface ExtendedTokensTable extends TokensTable {
  // Additional properties for serialization/deserialization
  deployments?: TokenDeploymentsTable[];
  operations?: TokenOperationsTable[];
  versions?: TokenVersionsTable[];
}

/**
 * Database Rule Table representation
 */
export interface RuleTable {
  rule_id: string;
  rule_name: string;
  rule_type: string;
  rule_details: Json;
  created_by: string;
  status: string;
  created_at: string;
  updated_at: string;
  is_template: boolean;
}

/**
 * Database Rule Insert type
 */
export type RuleInsert = Omit<RuleTable, 'rule_id' | 'created_at' | 'updated_at'> & {
  rule_id?: string;
};

/**
 * Database Rule Update type
 */
export type RuleUpdate = Partial<Omit<RuleTable, 'rule_id' | 'created_at' | 'updated_at'>>;

/**
 * Database Template Version Table representation
 */
export interface TemplateVersionTable {
  version_id: string;
  template_id: string;
  version: string;
  version_data: Json;
  notes?: string;
  created_at: string;
  created_by: string;
  updated_at?: string;
}

/**
 * Database Template Version Insert type
 */
export type TemplateVersionInsert = Omit<TemplateVersionTable, 'version_id' | 'created_at' | 'updated_at'> & {
  version_id?: string;
};

/**
 * Database Template Version Update type
 */
export type TemplateVersionUpdate = Partial<Omit<TemplateVersionTable, 'version_id' | 'created_at' | 'updated_at'>>;

/**
 * Database Policy Rule Approver Table representation
 */
export interface PolicyRuleApproverTable {
  policy_rule_id: string;
  user_id: string;
  created_at: string;
  created_by: string;
  status?: string;
  comment?: string;
  timestamp?: string;
}

/**
 * Database Policy Rule Approver Insert type
 */
export type PolicyRuleApproverInsert = Omit<PolicyRuleApproverTable, 'created_at'> & {
};

/**
 * Database Policy Rule Approver Update type
 */
export type PolicyRuleApproverUpdate = Partial<Omit<PolicyRuleApproverTable, 'policy_rule_id' | 'user_id' | 'created_at'>>;

/**
 * Database Policy Version Table representation
 */
export interface PolicyVersionTable {
  version_id: string;
  policy_id: string;
  version_number: number;
  policy_data: Json;
  created_by: string;
  comment: string;
  timestamp: string;
}

/**
 * Database Policy Version Insert type
 */
export type PolicyVersionInsert = Omit<PolicyVersionTable, 'version_id' | 'timestamp'> & {
  version_id?: string;
};

/**
 * Database Policy Version Update type
 */
export type PolicyVersionUpdate = Partial<Omit<PolicyVersionTable, 'version_id' | 'timestamp'>>;

/**
 * Database Audit Log Table representation
 */
export interface AuditLogTable {
  log_id: string;
  entity_id: string;
  entity_type: string;
  action: string;
  user_id: string;
  details: Json;
  timestamp: string;
}

/**
 * Database Audit Log Insert type
 */
export type AuditLogInsert = Omit<AuditLogTable, 'log_id' | 'timestamp'> & {
  log_id?: string;
};

/**
 * Database Policy model
 */
export interface DatabasePolicy {
  id: string;
  name: string;
  description: string;
  type: string;
  jurisdiction: string;
  effectiveDate: string;
  expirationDate?: string;
  tags: string[];
  reviewFrequency?: string;
  isActive: boolean;
  status: string;
  createdAt: string;
  modifiedAt: string;
  createdBy: string;
  version: number;
}

/**
 * Extended Organization Table with additional fields
 */
export interface ExtendedOrganizationsTable extends Partial<OrganizationsTable> {
  legal_name?: string;
  registration_number?: string;
  registration_date?: string;
  tax_id?: string;
  jurisdiction?: string;
  business_type?: string;
  status?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  address?: Json;
  legal_representatives?: Json;
  compliance_status?: string;
  onboarding_completed?: boolean;
}

/**
 * Extended Investor Table with additional fields
 */
export interface ExtendedInvestorsTable extends Partial<InvestorsTable> {
  investor_status?: string;
  onboarding_completed?: boolean;
  risk_assessment?: Json;
  profile_data?: Json;
  accreditation_status?: string;
  accreditation_expiry_date?: string;
  accreditation_type?: string;
  tax_residency?: string;
  tax_id_number?: string;
  investment_preferences?: Json;
  last_compliance_check?: string;
}

/**
 * Country Restriction model
 */
export interface CountryRestriction {
  id: string;
  country_code: string;
  country_name: string;
  is_blocked: boolean;
  reason: string;
  created_at: string;
  updated_at: string;
}

/**
 * Investor Type Restriction model
 */
export interface InvestorTypeRestriction {
  id: string;
  type: string;
  is_blocked: boolean;
  reason: string;
  minimum_investment?: number;
  required_documents: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Investor Validation results
 */
export interface InvestorValidation {
  id: string;
  investor_id: string;
  is_eligible: boolean;
  reasons: string[];
  required_documents: string[];
  validated_at: string;
}

/**
 * File Object from Storage
 */
export interface FileObject {
  name: string;
  bucket_id: string;
  owner: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

// Alias types for distribution tables
export type DistributionRow = Database['public']['Tables']['distributions']['Row'];
export type DistributionInsert = Database['public']['Tables']['distributions']['Insert'];
export type DistributionUpdate = Database['public']['Tables']['distributions']['Update'];

export type DistributionRedemptionRow = Database['public']['Tables']['distribution_redemptions']['Row'];
export type DistributionRedemptionInsert = Database['public']['Tables']['distribution_redemptions']['Insert'];
export type DistributionRedemptionUpdate = Database['public']['Tables']['distribution_redemptions']['Update'];

export type ProjectCredential = Database['public']['Tables']['project_credentials']['Row'];

// Re-export partition-related types directly
export type TokenErc1400PartitionBalancesTable = {
  id: string;
  partition_id: string;
  holder_address: string;
  balance: string;
  last_updated: string;
  metadata?: Json;
};

export type TokenErc1400PartitionTransfersTable = {
  id: string;
  partition_id: string;
  from_address: string;
  to_address: string;
  amount: string;
  operator_address?: string;
  timestamp: string;
  transaction_hash?: string;
  metadata?: Json;
};

export type TokenErc1400PartitionOperatorsTable = {
  id: string;
  partition_id: string;
  holder_address: string;
  operator_address: string;
  authorized: boolean;
  last_updated: string;
  metadata?: Json;
};

// Replace the problematic extension with a clean definition
export type TokenErc1400PartitionsTable = {
  id: string;
  token_id: string;
  name: string;
  partition_id: string;
  metadata?: Json;
  created_at: string;
  total_supply: string;
  partition_type?: string;
  amount?: string;
  updated_at?: string;
  corporate_actions?: boolean;
  custom_features?: Json;
  is_lockable?: boolean;
};

export type TokenErc1400DocumentsTable = {
  id: string;
  token_id: string;
  name: string;
  document_uri: string;
  document_type: string;
  document_hash?: string;
  created_at: string;
  updated_at: string;
};

export interface TokenDeploymentHistoryTable {
  id: string;
  token_id: string;
  project_id: string;
  status: string;
  transaction_hash: string | null;
  block_number: number | null;
  timestamp: string;
  error: string | null;
  blockchain: string;
  environment: string;
}

// ========================================
// ENHANCED DATABASE QUERY RESULT TYPES
// ========================================

/**
 * Complex Query Results for Token Operations
 */
export interface TokenWithPropertiesQueryResult {
  token: TokensTable;
  properties: TokenErc20PropertiesTable | TokenErc721PropertiesTable | TokenErc1155PropertiesTable | TokenErc1400PropertiesTable | TokenErc3525PropertiesTable | TokenErc4626PropertiesTable | null;
  deployments?: TokenDeploymentsTable[];
  operations?: TokenOperationsTable[];
  versions?: TokenVersionsTable[];
  allocations?: TokenAllocationsTable[];
  project?: {
    id: string;
    name: string;
    status: string;
  };
}

/**
 * Enhanced Database Query Options with Advanced Filtering
 */
export interface EnhancedDatabaseQueryOptions {
  filters?: {
    // Standard filters
    where?: Record<string, any>;
    search?: {
      query: string;
      fields: string[];
      fuzzy?: boolean;
    };
    
    // Date range filters
    dateRange?: {
      field: string;
      start?: string;
      end?: string;
    };
    
    // Numeric range filters
    numericRange?: {
      field: string;
      min?: number;
      max?: number;
    };
    
    // Array contains filters
    arrayContains?: Record<string, any[]>;
    
    // JSON path filters
    jsonPath?: Record<string, any>;
  };
  
  pagination?: {
    page: number;
    limit: number;
    offset?: number;
    cursor?: string; // For cursor-based pagination
  };
  
  sorting?: Array<{
    field: string;
    direction: 'asc' | 'desc';
    nullsFirst?: boolean;
  }>;
  
  include?: {
    relations?: string[];
    nested?: Record<string, EnhancedDatabaseQueryOptions>;
  };
  
  aggregations?: {
    count?: string[];
    sum?: string[];
    avg?: string[];
    min?: string[];
    max?: string[];
    groupBy?: string[];
  };
  
  performance?: {
    useIndex?: string;
    explain?: boolean;
    timeout?: number;
  };
}

/**
 * Enhanced Paginated Result with Metadata
 */
export interface EnhancedPaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    totalPages: number;
    nextCursor?: string;
    prevCursor?: string;
  };
  aggregations?: Record<string, any>;
  metadata: {
    executionTime: number;
    cacheHit: boolean;
    queryComplexity: number;
    indexesUsed: string[];
  };
}

/**
 * Token Analytics Query Result
 */
export interface TokenAnalyticsQueryResult {
  tokenId: string;
  analytics: {
    totalSupply: string;
    circulatingSupply: string;
    holders: number;
    transactions: number;
    volume24h: string;
    volumeAllTime: string;
    marketCap?: string;
    price?: string;
    priceChange24h?: number;
  };
  distribution: Array<{
    address: string;
    balance: string;
    percentage: number;
  }>;
  activity: Array<{
    date: string;
    transactions: number;
    volume: string;
    activeAddresses: number;
  }>;
}

/**
 * Project Token Summary Query Result
 */
export interface ProjectTokenSummaryQueryResult {
  projectId: string;
  projectName: string;
  tokens: Array<{
    id: string;
    name: string;
    symbol: string;
    standard: string;
    status: string;
    totalSupply?: string;
    deploymentStatus?: string;
    lastActivity?: string;
  }>;
  summary: {
    totalTokens: number;
    deployedTokens: number;
    pendingTokens: number;
    totalValue?: string;
    totalHolders?: number;
  };
}

/**
 * Compliance Dashboard Query Result
 */
export interface ComplianceDashboardQueryResult {
  overview: {
    totalInvestors: number;
    kycApproved: number;
    kycPending: number;
    accreditationApproved: number;
    accreditationPending: number;
    complianceIssues: number;
  };
  
  investors: Array<{
    id: string;
    name: string;
    email: string;
    kycStatus: string;
    accreditationStatus: string;
    riskScore?: number;
    lastReview?: string;
    issues?: string[];
  }>;
  
  documents: Array<{
    id: string;
    investorId: string;
    documentType: string;
    status: string;
    expiryDate?: string;
    reviewedBy?: string;
  }>;
  
  auditTrail: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    timestamp: string;
    details: any;
  }>;
}

/**
 * Financial Dashboard Query Result
 */
export interface FinancialDashboardQueryResult {
  summary: {
    totalInvestments: string;
    totalRedemptions: string;
    activeInvestments: number;
    pendingTransactions: number;
    portfolioValue: string;
    totalReturns: string;
    returnPercentage: number;
  };
  
  investments: Array<{
    id: string;
    projectId: string;
    projectName: string;
    investorId: string;
    investorName: string;
    amount: string;
    tokenAmount: string;
    date: string;
    status: string;
    currentValue?: string;
  }>;
  
  redemptions: Array<{
    id: string;
    investorId: string;
    tokenType: string;
    amount: string;
    status: string;
    requestDate: string;
    processedDate?: string;
  }>;
  
  performance: Array<{
    date: string;
    portfolioValue: string;
    netFlow: string;
    returns: string;
  }>;
}

// ========================================
// ENHANCED TABLE EXTENSIONS
// ========================================

/**
 * Enhanced ERC20 Properties with Advanced DeFi Features
 */
export type EnhancedTokenErc20PropertiesTable = TokenErc20PropertiesTable & {
  // Advanced DeFi features
  governance_enabled?: boolean;
  quorum_percentage?: string;
  proposal_threshold?: string;
  voting_delay?: number;
  voting_period?: number;
  timelock_delay?: number;
  
  // Anti-whale protection (enhanced fields)
  anti_whale_enabled?: boolean;
  max_wallet_amount?: string;
  max_transaction_amount?: string;
  cooldown_period?: number;
  
  // Economic features
  deflation_enabled?: boolean;
  deflation_rate?: string;
  staking_enabled?: boolean;
  staking_rewards_rate?: string;
  liquidity_mining?: boolean;
  
  // Fee structure (enhanced fields)
  buy_fee_enabled?: boolean;
  sell_fee_enabled?: boolean;
  liquidity_fee_percentage?: string;
  marketing_fee_percentage?: string;
  charity_fee_percentage?: string;
  burn_fee_percentage?: string;
  
  // Flash loan protection
  flash_loan_protection?: boolean;
  max_flash_loan_amount?: string;
  flash_loan_fee?: string;
  
  // MEV protection
  mev_protection?: boolean;
  max_slippage?: string;
  front_running_protection?: boolean;
  
  // Supply management
  supply_model?: string;
  max_supply?: string;
  circulating_supply?: string;
  locked_supply?: string;
  burned_supply?: string;
  
  // Rebase mechanics
  rebase_enabled?: boolean;
  rebase_frequency?: string;
  target_price?: string;
  price_oracle?: string;
  
  // Cross-chain features
  cross_chain_enabled?: boolean;
  supported_chains?: string[];
  bridge_protocol?: string;
  bridge_config?: Json;
  
  // Oracle integration
  oracle_integration?: Json;
  price_oracles?: Json;
  chainlink_feeds?: string[];
  
  // Advanced compliance
  regulatory_framework?: string;
  kyc_provider?: string;
  aml_provider?: string;
  sanctions_screening?: boolean;
  tax_reporting?: boolean;
  
  // Performance monitoring
  performance_monitoring?: Json;
  gas_optimization?: boolean;
  tx_monitoring?: boolean;
  error_tracking?: boolean;
  
  // Multi-sig configuration
  multisig_config?: Json;
  operation_thresholds?: Json;
  time_locks?: Json;
  emergency_pause?: Json;
}

/**
 * Enhanced ERC721 Properties with Advanced NFT Features
 */
export type EnhancedTokenErc721PropertiesTable = TokenErc721PropertiesTable & {
  // Metadata management
  dynamic_metadata?: boolean;
  metadata_freezing?: boolean;
  metadata_versioning?: boolean;
  ipfs_gateway?: string;
  
  // Royalty distribution
  royalty_standard?: string;
  royalty_distribution?: Json;
  
  // Fractional ownership
  fractional_ownership?: boolean;
  fraction_token_standard?: string;
  
  // Staking and rewards (enhanced fields)
  staking_enabled?: boolean;
  staking_rewards?: Json;
  
  // Utility features (enhanced fields)
  utility_enabled?: boolean;
  utility_config?: Json;
  
  // Gaming integration
  game_integration?: boolean;
  physical_redemption?: boolean;
  access_rights?: string[];
  
  // Collection features
  collection_size?: number;
  rarity_levels?: Json;
  trait_distribution?: Json;
  
  // Marketplace integration
  marketplace_integration?: Json;
  trading_fee?: string;
  creator_earnings?: string;
}

/**
 * Enhanced ERC1155 Properties with Advanced Multi-Token Features
 */
export type EnhancedTokenErc1155PropertiesTable = TokenErc1155PropertiesTable & {
  // Advanced batch operations
  batch_size_limit?: number;
  batch_gas_optimization?: boolean;
  
  // Container management
  container_nesting_depth?: number;
  container_access_control?: Json;
  
  // Gaming features
  gaming_integration?: boolean;
  item_crafting?: boolean;
  item_trading?: boolean;
  
  // Marketplace features
  marketplace_config?: Json;
  trading_fees?: Json;
  royalty_enforcement?: boolean;
  
  // Supply management per type
  type_supply_tracking?: Json;
  type_max_supplies?: Json;
  
  // Cross-game compatibility
  cross_game_standard?: boolean;
  metadata_standard?: string;
}

/**
 * Enhanced ERC1400 Properties with Advanced Security Token Features
 */
export type EnhancedTokenErc1400PropertiesTable = TokenErc1400PropertiesTable & {
  // Enhanced compliance (enhanced fields)
  compliance_automation_level?: string;
  regulatory_reporting?: boolean;
  audit_trail_encryption?: boolean;
  
  // Advanced controller features
  controller_hierarchy?: Json;
  delegated_controllers?: Json;
  controller_permissions?: Json;
  
  // Dividend and corporate actions
  dividend_automation?: boolean;
  corporate_action_queue?: Json;
  shareholder_voting?: boolean;
  
  // Multi-jurisdiction support
  jurisdiction_rules?: Json;
  cross_border_restrictions?: Json;
  
  // Institutional features (enhanced fields)
  institutional_controls?: Json;
  custodian_integration?: Json;
  settlement_integration?: Json; // Enhanced type
}

/**
 * Enhanced ERC3525 Properties with Advanced Semi-Fungible Features
 */
export type EnhancedTokenErc3525PropertiesTable = TokenErc3525PropertiesTable & {
  // Advanced slot management
  slot_inheritance?: boolean;
  slot_metadata_standard?: string;
  cross_slot_operations?: boolean;
  
  // Financial instrument features
  instrument_valuation?: Json;
  risk_metrics?: Json;
  performance_tracking?: Json;
  
  // Liquidity features
  liquidity_pools?: Json;
  automated_market_making?: boolean;
  price_discovery?: Json;
  
  // Derivatives support
  derivative_instruments?: Json;
  option_chains?: Json;
  futures_contracts?: Json;
  
  // Compliance and reporting (enhanced fields)
  regulatory_reporting?: Json;
  position_limits?: Json;
  margin_requirements?: Json; // Enhanced type
}

/**
 * Enhanced ERC4626 Properties with Advanced Vault Features
 */
export type EnhancedTokenErc4626PropertiesTable = TokenErc4626PropertiesTable & {
  // Advanced strategy management
  strategy_weights?: Json;
  rebalancing_automation?: boolean;
  risk_management?: Json;
  
  // Performance tracking
  performance_benchmarks?: Json;
  historical_performance?: Json;
  risk_adjusted_returns?: Json;
  
  // Institutional features
  institutional_share_classes?: Json;
  management_fee_tiers?: Json;
  lock_up_periods?: Json;
  
  // DeFi protocol integrations (enhanced fields)
  protocol_allocations?: Json;
  yield_optimization?: Json;
  impermanent_loss_protection?: boolean; // Enhanced type
  
  // Risk management
  risk_limits?: Json;
  stop_loss_triggers?: Json;
  volatility_controls?: Json;
  
  // Governance features
  strategy_governance?: Json;
  fee_governance?: Json;
  parameter_governance?: Json;
}

// ========================================
// BATCH OPERATION TYPES
// ========================================

/**
 * Batch Insert Operations
 */
export interface BatchInsertRequest<T> {
  table: string;
  data: T[];
  options?: {
    onConflict?: 'ignore' | 'update' | 'error';
    batchSize?: number;
    validateBeforeInsert?: boolean;
    returnInserted?: boolean;
  };
}

/**
 * Batch Update Operations
 */
export interface BatchUpdateRequest<T> {
  table: string;
  updates: Array<{
    where: Record<string, any>;
    data: Partial<T>;
  }>;
  options?: {
    batchSize?: number;
    validateBeforeUpdate?: boolean;
    returnUpdated?: boolean;
  };
}

/**
 * Batch Operation Result
 */
export interface BatchOperationResult<T> {
  successful: T[];
  failed: Array<{
    index: number;
    error: string;
    data: any;
  }>;
  summary: {
    total: number;
    success: number;
    failed: number;
    executionTime: number;
  };
}

// ========================================
// CACHE AND PERFORMANCE TYPES
// ========================================

/**
 * Database Cache Configuration
 */
export interface DatabaseCacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'lfu' | 'ttl';
  keyPattern?: string;
  excludeTables?: string[];
}

/**
 * Query Performance Metrics
 */
export interface QueryPerformanceMetrics {
  queryId: string;
  executionTime: number;
  rowsReturned: number;
  bytesReturned: number;
  cacheHit: boolean;
  indexesUsed: string[];
  queryPlan?: any;
  timestamp: string;
}
