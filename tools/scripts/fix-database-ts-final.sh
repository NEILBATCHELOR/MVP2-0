#!/bin/bash

# This script fixes the database.ts file by removing the broken section and duplicate type declarations

echo "Fixing database.ts file..."

# Create a backup of the original file
cp src/types/database.ts src/types/database.ts.bak4

# Create a new file with fixed content
cat > src/types/database.ts.new << 'EOL'
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

// AUTOMATICALLY GENERATED FIXES
// Fix for PolicyTemplateTable -> PolicyTemplatesTable
export type PolicyTemplatesTable = Tables<'policy_templates'>;

// Fix for PolicyTemplateApproverTable -> PolicyTemplateApproversTable
export type PolicyTemplateApproversTable = Tables<'policy_template_approvers'>;

// Fix for UserTable -> UsersTable
export type UsersTable = Tables<'users'>;

// Fix for RoleTable -> RolesTable
export type RolesTable = Tables<'roles'>;

// Fix for SubscriptionTable -> SubscriptionsTable
export type SubscriptionsTable = Tables<'subscriptions'>;

// Fix for RedemptionRequestTable -> RedemptionRequestsTable
export type RedemptionRequestsTable = Tables<'redemption_requests'>;

// Fix for RedemptionApproverTable -> RedemptionApproversTable
export type RedemptionApproversTable = Tables<'redemption_approvers'>;

// Fix for TokenAllocationTable -> TokenAllocationsTable
export type TokenAllocationsTable = Tables<'token_allocations'>;

// Fix for TokenTable -> TokensTable
export type TokensTable = Tables<'tokens'>;

// Fix for TokenVersionTable -> TokenVersionsTable
export type TokenVersionsTable = Tables<'token_versions'>;

// Fix for TokenDeploymentTable -> TokenDeploymentsTable
export type TokenDeploymentsTable = Tables<'token_deployments'>;

// Fix for TokenOperationTable -> TokenOperationsTable
export type TokenOperationsTable = Tables<'token_operations'>;

// Fix for TokenDesignTable -> TokenDesignsTable
export type TokenDesignsTable = Tables<'token_designs'>;

// Fix for TokenTemplateTable -> TokenTemplatesTable
export type TokenTemplatesTable = Tables<'token_templates'>;

// Fix for IssuerDocumentTable -> IssuerDocumentsTable
export type IssuerDocumentsTable = Tables<'issuer_documents'>;

// Fix for IssuerDetailDocumentTable -> IssuerDetailDocumentsTable
export type IssuerDetailDocumentsTable = Tables<'issuer_detail_documents'> & {
  is_public?: boolean;
};

// Fix for OrganizationTable -> OrganizationsTable
export type OrganizationsTable = Tables<'organizations'>;

// Fix for InvestorTable -> InvestorsTable
export type InvestorsTable = Tables<'investors'>;

// Fix for InvestorApprovalTable -> InvestorApprovalsTable
export type InvestorApprovalsTable = Tables<'investor_approvals'>;

// Fix for DistributionTable -> DistributionsTable
export type DistributionsTable = Tables<'distributions'>;

// Fix for DistributionRedemptionTable -> DistributionRedemptionsTable
export type DistributionRedemptionsTable = Tables<'distribution_redemptions'>;

// Fix for TokenERC20PropertiesTable -> TokenErc20PropertiesTable
export type TokenErc20PropertiesTable = Tables<'token_erc20_properties'>;

// Fix for TokenERC721PropertiesTable -> TokenErc721PropertiesTable
export type TokenErc721PropertiesTable = Tables<'token_erc721_properties'>;

// Fix for TokenERC721AttributesTable -> TokenErc721AttributesTable
export type TokenErc721AttributesTable = Tables<'token_erc721_attributes'>;

// Fix for TokenERC1155PropertiesTable -> TokenErc1155PropertiesTable
export type TokenErc1155PropertiesTable = Tables<'token_erc1155_properties'>;

// Fix for TokenERC1155TypesTable -> TokenErc1155TypesTable
export type TokenErc1155TypesTable = Tables<'token_erc1155_types'>;

// Fix for TokenERC1155BalancesTable -> TokenErc1155BalancesTable
export type TokenErc1155BalancesTable = Tables<'token_erc1155_balances'>;

// Fix for TokenERC1155UriMappingsTable -> TokenErc1155UriMappingsTable
export type TokenErc1155UriMappingsTable = Tables<'token_erc1155_uri_mappings'>;

// Fix for TokenERC1400PropertiesTable -> TokenErc1400PropertiesTable
export type TokenErc1400PropertiesTable = Tables<'token_erc1400_properties'>;

// Fix for TokenERC1400ControllersTable -> TokenErc1400ControllersTable
export type TokenErc1400ControllersTable = Tables<'token_erc1400_controllers'>;

// Fix for TokenERC1400PartitionsTable -> TokenErc1400PartitionsTable
export type TokenErc1400PartitionsTable = Tables<'token_erc1400_partitions'>;

// Fix for TokenERC3525PropertiesTable -> TokenErc3525PropertiesTable
export type TokenErc3525PropertiesTable = Tables<'token_erc3525_properties'>;

// Fix for TokenERC3525SlotsTable -> TokenErc3525SlotsTable
export type TokenErc3525SlotsTable = Tables<'token_erc3525_slots'>;

// Fix for TokenERC3525AllocationsTable -> TokenErc3525AllocationsTable
export type TokenErc3525AllocationsTable = Tables<'token_erc3525_allocations'>;

// Fix for TokenERC4626PropertiesTable -> TokenErc4626PropertiesTable
export type TokenErc4626PropertiesTable = Tables<'token_erc4626_properties'>;

// Fix for TokenERC4626StrategyParamsTable -> TokenErc4626StrategyParamsTable
export type TokenErc4626StrategyParamsTable = Tables<'token_erc4626_strategy_params'>;

// Fix for TokenERC4626AssetAllocationsTable -> TokenErc4626AssetAllocationsTable
export type TokenErc4626AssetAllocationsTable = Tables<'token_erc4626_asset_allocations'>;

// Fix for BlockchainTransactionTable -> WalletTransactionsTable
export type WalletTransactionsTable = Tables<'wallet_transactions'>;

// Fix for TransactionNotificationTable -> TransactionNotificationsTable
export type TransactionNotificationsTable = Tables<'transaction_notifications'>;

// Custom token interface that consolidates the core token table with extended properties
export interface ExtendedTokenTable extends TokensTable {
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
export interface ExtendedOrganizationTable extends Partial<OrganizationsTable> {
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
export interface ExtendedInvestorTable extends Partial<InvestorsTable> {
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
EOL

# Replace the original file with the fixed version
mv src/types/database.ts.new src/types/database.ts

echo "database.ts file fixed!"

echo "Fixing IssuerDetailDocumentsTable interface..."

# Backup the original file
cp src/types/database.ts src/types/database.ts.bak_fix_interface

# Fix the IssuerDetailDocumentsTable interface by ensuring it includes the is_public property
sed -i.tmp -E 's/export type IssuerDetailDocumentsTable = Tables<'"'"'issuer_detail_documents'"'"'>;/export type IssuerDetailDocumentsTable = Tables<'"'"'issuer_detail_documents'"'"'> \& {\n  is_public?: boolean;\n};/' src/types/database.ts

# Remove the temporary file
rm src/types/database.ts.tmp

echo "IssuerDetailDocumentsTable interface fixed successfully."

echo "Updating all table type references to use plural forms..."

# Create a list of table types with their plural forms
declare -A table_mappings=(
  ["PolicyTemplateTable"]="PolicyTemplatesTable"
  ["PolicyTemplateApproverTable"]="PolicyTemplateApproversTable"
  ["UserTable"]="UsersTable"
  ["RoleTable"]="RolesTable"
  ["SubscriptionTable"]="SubscriptionsTable"
  ["RedemptionRequestTable"]="RedemptionRequestsTable"
  ["RedemptionApproverTable"]="RedemptionApproversTable"
  ["TokenAllocationTable"]="TokenAllocationsTable"
  ["TokenTable"]="TokensTable"
  ["TokenVersionTable"]="TokenVersionsTable"
  ["TokenDeploymentTable"]="TokenDeploymentsTable"
  ["TokenOperationTable"]="TokenOperationsTable"
  ["TokenDesignTable"]="TokenDesignsTable"
  ["TokenTemplateTable"]="TokenTemplatesTable"
  ["IssuerDocumentTable"]="IssuerDocumentsTable"
  ["IssuerDetailDocumentTable"]="IssuerDetailDocumentsTable"
  ["OrganizationTable"]="OrganizationsTable"
  ["InvestorTable"]="InvestorsTable"
  ["InvestorApprovalTable"]="InvestorApprovalsTable"
  ["DistributionTable"]="DistributionsTable"
  ["DistributionRedemptionTable"]="DistributionRedemptionsTable"
  ["TokenErc20PropertiesTable"]="TokenErc20PropertiesTable"
  ["TokenErc721PropertiesTable"]="TokenErc721PropertiesTable"
  ["TokenErc721AttributesTable"]="TokenErc721AttributesTable"
  ["TokenErc1155PropertiesTable"]="TokenErc1155PropertiesTable"
  ["TokenErc1155TypesTable"]="TokenErc1155TypesTable"
  ["TokenErc1155BalancesTable"]="TokenErc1155BalancesTable"
  ["TokenErc1155UriMappingsTable"]="TokenErc1155UriMappingsTable"
  ["TokenErc1400PropertiesTable"]="TokenErc1400PropertiesTable"
  ["TokenErc1400ControllersTable"]="TokenErc1400ControllersTable"
  ["TokenErc1400PartitionsTable"]="TokenErc1400PartitionsTable"
  ["TokenErc3525PropertiesTable"]="TokenErc3525PropertiesTable"
  ["TokenErc3525SlotsTable"]="TokenErc3525SlotsTable"
  ["TokenErc3525AllocationsTable"]="TokenErc3525AllocationsTable"
  ["TokenErc4626PropertiesTable"]="TokenErc4626PropertiesTable"
  ["TokenErc4626StrategyParamsTable"]="TokenErc4626StrategyParamsTable"
  ["TokenErc4626AssetAllocationsTable"]="TokenErc4626AssetAllocationsTable"
  ["BlockchainTransactionTable"]="WalletTransactionsTable"
  ["TransactionNotificationTable"]="TransactionNotificationsTable"
)

# For reference, keep a record of the original file
cp src/types/database.ts src/types/database.ts.before_references

# Loop through each mapping and update references
for singular in "${!table_mappings[@]}"; do
  plural="${table_mappings[$singular]}"
  echo "Updating references from $singular to $plural"
  
  # Replace any remaining occurrences of the singular form with the plural form
  # Exclude lines that are commented out
  find src -type f -name "*.ts" ! -path "*/node_modules/*" -exec sed -i.tmp -E "s/([^\/\*]*)\b$singular\b/\1$plural/g" {} \;
  find src -type f -name "*.tsx" ! -path "*/node_modules/*" -exec sed -i.tmp -E "s/([^\/\*]*)\b$singular\b/\1$plural/g" {} \;
  
  # Cleanup temp files
  find src -name "*.tmp" -delete
done

echo "Table type references updated successfully."