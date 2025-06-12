#!/bin/bash

# 1. Replace ethers import statements with a placeholder for manual adjustment
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec \
  sed -i '' 's/import\s\+{\s*ethers\s*}\s\+from\s*["'\'']ethers["'\''];/\/\/ TODO: Replace with direct named imports from ethers v6/g' {} +

find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec \
  sed -i '' 's/import\s\+\*\s\+as\s\+ethers\s\+from\s*["'\'']ethers["'\''];/\/\/ TODO: Replace with direct named imports from ethers v6/g' {} +

# 2. Replace ethers.utils and ethers.providers usages
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec \
  sed -i '' 's/ethers\.utils\./ /g' {} +

find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec \
  sed -i '' 's/ethers\.providers\./ /g' {} +

# 3. Replace ethers.Contract, ethers.Wallet, etc. with direct usage
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec \
  sed -i '' 's/new ethers\.Contract(/new Contract(/g' {} +

find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec \
  sed -i '' 's/new ethers\.Wallet(/new Wallet(/g' {} +

# 4. Print files that still mention 'ethers' for manual review
echo "Files still mentioning 'ethers' after script (manual review required):"
grep -ril 'ethers' src

echo "Sweeping ethers v6 migration script complete."
echo "You MUST manually update the import lines to include only the functions/classes/types you actually use in each file."
echo "Run 'npx tsc --noEmit' after this to check for any remaining issues."