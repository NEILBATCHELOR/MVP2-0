#!/bin/bash

# Comprehensive script to fix all type-related issues
echo "🔄 Starting comprehensive type system fix..."

# Create a timestamp for backups
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_DIR="src/types/backups_${TIMESTAMP}"

# Create a backup directory
mkdir -p $BACKUP_DIR
echo "📦 Created backup directory: $BACKUP_DIR"

# Backup original files
cp src/types/database.ts "$BACKUP_DIR/database.ts.original"
cp src/types/centralModels.ts "$BACKUP_DIR/centralModels.ts.original"
cp scripts/validate-types.ts "$BACKUP_DIR/validate-types.ts.original"
echo "💾 Backed up original files"

echo "🧹 Step 1: Removing duplicate type declarations from database.ts..."
# Backup the file before modifications
cp src/types/database.ts "$BACKUP_DIR/database.ts.before_remove_duplicates"

# Remove singularly named table types that have plural equivalents 
sed -i.tmp -E '/(export type).*Table[ ]*=[ ]*Tables<.*>/d' src/types/database.ts
rm src/types/database.ts.tmp

echo "🔧 Step 2: Fixing the IssuerDetailDocumentsTable interface..."
# Backup the file before modifications
cp src/types/database.ts "$BACKUP_DIR/database.ts.before_fix_interface"

# Fix the IssuerDetailDocumentsTable interface
sed -i.tmp -E 's/export type IssuerDetailDocumentsTable = Tables<'"'"'issuer_detail_documents'"'"'>;/export type IssuerDetailDocumentsTable = Tables<'"'"'issuer_detail_documents'"'"'> \& {\n  is_public?: boolean;\n};/' src/types/database.ts
rm src/types/database.ts.tmp

echo "🔄 Step 3: Updating table type references to use plural forms..."
# Backup the file before references update
cp src/types/database.ts "$BACKUP_DIR/database.ts.before_references"

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
  grep -l "$singular" $(find src -type f -name "*.ts" -o -name "*.tsx" | grep -v "node_modules") 2>/dev/null | xargs -I{} sed -i.tmp "s/\([^\/\*]*\)\b$singular\b/\1$plural/g" {} 2>/dev/null || true
  
  # Clean up temp files
  find src -name "*.tmp" -delete
done

echo "🔍 Step 4: Fixing the validation script..."
# Backup the validation script
cp scripts/validate-types.ts "$BACKUP_DIR/validate-types.ts.before_fix"

# Create a temporary file with the updated extractSupabaseTables function
cat > extract_function.tmp << 'EOL'
/**
 * Extract table definitions from supabase.ts
 */
function extractSupabaseTables(content: string): string[] {
  // Look for table names in the Database type definition
  const tableMatches = content.match(/(?:[a-zA-Z_]+): \{\s+Row: \{[^}]+\}/g);
  
  if (!tableMatches) {
    error('Could not find table definitions in supabase.ts');
    return [];
  }

  // Extract table names from the matches
  const tables: string[] = [];
  const tableNamePattern = /^([a-zA-Z_]+):/;
  
  for (const tableMatch of tableMatches) {
    const nameMatch = tableMatch.match(tableNamePattern);
    if (nameMatch && nameMatch[1]) {
      tables.push(nameMatch[1]);
    }
  }
  
  if (tables.length === 0) {
    error('Could not extract table names from supabase.ts');
  }
  
  return tables;
}
EOL

# Replace the extractSupabaseTables function in the script
sed -i.tmp '/function extractSupabaseTables/,/^}/c\\
'"$(cat extract_function.tmp)" scripts/validate-types.ts

# Remove temporary file
rm extract_function.tmp
rm -f scripts/validate-types.ts.tmp

# Update the CONFIG.uiInterfaces array to include more UI-specific interfaces
sed -i.tmp 's/uiInterfaces: \[/uiInterfaces: \[\n    "ProjectUI", "SubscriptionUI", "InvoiceItem", "Invoice", "InvestorWithDetails",/' scripts/validate-types.ts
rm -f scripts/validate-types.ts.tmp

echo "✅ All fixes have been applied!"
echo "📋 Next steps:"
echo "1. Run the validation script to check for any remaining issues:"
echo "   NODE_OPTIONS=\"--loader ts-node/esm\" ts-node --esm scripts/validate-types.ts"
echo "2. Fix any remaining warnings as needed"
echo "3. Update type mappers and type guards for new types"
echo ""
echo "💡 Note: Some warnings are expected, particularly for:"
echo "- Missing table types for some database tables"
echo "- Incomplete type groups (missing Insert and Update types)"
echo "- Some misalignments between centralModels.ts and database.ts"
echo "- Missing type mappers and type guards"
echo ""
echo "These remaining warnings can be addressed by:"
echo "1. Creating missing Insert/Update types for tables that need them"
echo "2. Generating missing type mappers in src/utils/formatting/typeMappers.ts"
echo "3. Adding type guards in src/utils/types/typeGuards.ts"