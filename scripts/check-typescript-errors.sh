#!/bin/bash
# Script to check for remaining TypeScript errors in the fixed files

echo "Checking TypeScript errors in fixed files..."
echo "================================================"

# List of files we fixed
files=(
  "src/components/tokens/services/enhancedERC1400Service.ts"
  "src/components/tokens/services/enhancedERC3525Service.ts"
  "src/components/tokens/services/enhancedERC4626Service.ts"
  "src/types/tokens/index.ts"
  "src/services/deployment/DeploymentService.ts"
)

# Check each file
for file in "${files[@]}"; do
  echo -e "\nChecking: $file"
  echo "--------------------------------"
  npx tsc --noEmit --skipLibCheck "$file" 2>&1 | grep -E "error TS" | head -5 || echo "✓ No errors found"
done

echo -e "\n================================================"
echo "TypeScript error check complete"
