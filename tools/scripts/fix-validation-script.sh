#!/bin/bash

# Script to fix the validate-types.ts script - focusing just on the extractSupabaseTables function
echo "Fixing validation script..."

# Backup the original script
cp scripts/validate-types.ts scripts/validate-types.ts.bak

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

# Use sed to replace the extractSupabaseTables function in the script
sed -i.tmp '/function extractSupabaseTables/,/^}/c\\
'"$(cat extract_function.tmp)" scripts/validate-types.ts

# Remove temporary files
rm extract_function.tmp
rm -f scripts/validate-types.ts.tmp

# Also update the CONFIG.uiInterfaces array to include more UI interfaces
sed -i.tmp 's/uiInterfaces: \[/uiInterfaces: \[\n    "ProjectUI", "SubscriptionUI", "InvoiceItem", "Invoice", "InvestorWithDetails",/' scripts/validate-types.ts
rm -f scripts/validate-types.ts.tmp

echo "Validation script fixed successfully."