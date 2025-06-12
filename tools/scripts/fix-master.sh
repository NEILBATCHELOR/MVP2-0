#!/bin/bash

# Master script to fix all type inconsistencies in the project
# This script combines all the individual fix scripts into a single workflow

echo "🔧 Starting Type System Master Fix..."
echo "===================================="

# Step 1: Fix the database.ts file by removing broken sections and duplicate type declarations
echo "Step 1: Fixing database.ts file..."
./scripts/fix-database-ts-final.sh

# Step 2: Run TypeScript compiler to check for errors
echo "Step 2: Checking for TypeScript errors..."
if tsc --noEmit src/types/database.ts; then
  echo "✅ database.ts compiles without errors!"
else
  echo "❌ database.ts still has errors. Please check the output above."
  exit 1
fi

# Step 3: Generate a report of remaining issues
echo "Step 3: Generating report of remaining issues..."
node --loader ts-node/esm scripts/validate-types.ts > type-system-report.txt 2>&1

echo ""
echo "Type system fix complete!"
echo "The database.ts file has been fixed to remove duplicate types and syntax errors."
echo "A report of remaining issues has been generated in type-system-report.txt."
echo ""
echo "Next steps:"
echo "1. Review type-system-report.txt for remaining issues"
echo "2. Run './scripts/generate-all-mappers-runner.sh' to generate missing type mappers"
echo "3. Consider adding Insert and Update types for tables that are missing them"