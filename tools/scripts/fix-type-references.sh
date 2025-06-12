#!/bin/bash

# Script to update table type references to use plural forms
echo "🔄 Updating table type references to use plural forms..."

# Define mappings using parallel arrays for compatibility
SINGULAR=(
  "PolicyTemplateTable"
  "PolicyTemplateApproverTable"
  "UserTable"
  "RoleTable"
  "SubscriptionTable"
  "RedemptionRequestTable"
  "RedemptionApproverTable"
  "TokenAllocationTable"
  "TokenTable"
  "TokenVersionTable"
  "TokenDeploymentTable"
  "TokenOperationTable"
  "TokenDesignTable"
  "TokenTemplateTable"
  "IssuerDocumentTable"
  "IssuerDetailDocumentTable"
  "OrganizationTable"
  "InvestorTable"
  "InvestorApprovalTable"
  "DistributionTable"
  "DistributionRedemptionTable"
)

PLURAL=(
  "PolicyTemplatesTable"
  "PolicyTemplateApproversTable"
  "UsersTable"
  "RolesTable"
  "SubscriptionsTable"
  "RedemptionRequestsTable"
  "RedemptionApproversTable"
  "TokenAllocationsTable"
  "TokensTable"
  "TokenVersionsTable"
  "TokenDeploymentsTable"
  "TokenOperationsTable"
  "TokenDesignsTable"
  "TokenTemplatesTable"
  "IssuerDocumentsTable"
  "IssuerDetailDocumentsTable"
  "OrganizationsTable"
  "InvestorsTable"
  "InvestorApprovalsTable"
  "DistributionsTable"
  "DistributionRedemptionsTable"
)

# Loop through each mapping and update references
for i in $(seq 0 $((${#SINGULAR[@]} - 1))); do
  singular=${SINGULAR[$i]}
  plural=${PLURAL[$i]}
  echo "  Updating references from $singular to $plural"
  
  # Replace references in .ts and .tsx files
  # Using grep to find files first, then applying sed
  grep -l "$singular" $(find src -type f -name "*.ts" -o -name "*.tsx" | grep -v "node_modules") | xargs -I{} sed -i.tmp "s/\([^\/\*]*\)\b$singular\b/\1$plural/g" {}
  
  # Clean up temp files
  find src -name "*.tmp" -delete
done

echo "Table type references updated successfully."