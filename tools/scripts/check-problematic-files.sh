#!/bin/bash
# Script to analyze specific TypeScript files with reported errors

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create a new report file
REPORT_FILE="error-analysis-report.md"
echo "# Error Analysis Report" > $REPORT_FILE
echo "Generated on $(date)" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Run symlinks script first to ensure paths are correct
echo -e "${YELLOW}Setting up path resolution...${NC}"
./scripts/create-symlinks.sh

# List of problematic files to check
FILES=(
  "src/components/captable/TokenAllocationTable.tsx"
  "src/components/subscriptions/SubscriptionManager.tsx"
  "src/context/Web3Context.tsx"
  "src/lib/activityLogger.ts"
  "src/lib/projects.ts"
  "src/lib/redemptions.ts"
  "src/lib/services/documentStorage.ts"
  "src/lib/services/onfidoService.ts"
  "src/lib/supabase.ts"
  "src/lib/wallet.ts"
  "src/lib/web3/TokenManager.ts"
  "src/lib/web3/WalletManager.ts"
  "src/services/realtimeService.ts"
)

echo -e "${YELLOW}Checking type issues in problematic files...${NC}"

# Temporary file for error output
ERROR_OUTPUT=$(mktemp)

# Count total errors across all files
TOTAL_ERRORS=0
TOTAL_FILES_WITH_ERRORS=0

for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    echo -e "Checking ${YELLOW}$FILE${NC}..."
    
    # Run TypeScript compiler on file with no emit
    npx tsc --noEmit --skipLibCheck --esModuleInterop "$FILE" 2> "$ERROR_OUTPUT"
    
    # Count errors in this file
    ERROR_COUNT=$(grep -c "error TS" "$ERROR_OUTPUT")
    
    if [ $ERROR_COUNT -eq 0 ]; then
      echo -e "  ${GREEN}No errors found!${NC}"
    else
      TOTAL_FILES_WITH_ERRORS=$((TOTAL_FILES_WITH_ERRORS + 1))
      TOTAL_ERRORS=$((TOTAL_ERRORS + ERROR_COUNT))
      echo -e "  ${RED}Found $ERROR_COUNT errors!${NC}"
      
      # Display the first 10 errors or all if less than 10
      if [ $ERROR_COUNT -gt 10 ]; then
        echo -e "  ${YELLOW}First 10 errors:${NC}"
        grep "error TS" "$ERROR_OUTPUT" | head -10
        echo -e "  ${YELLOW}...and $((ERROR_COUNT - 10)) more errors.${NC}"
      else
        echo -e "  ${YELLOW}Errors:${NC}"
        grep "error TS" "$ERROR_OUTPUT"
      fi
    fi
    
    echo ""
  else
    echo -e "${RED}File not found: $FILE${NC}"
  fi
done

echo -e "${YELLOW}Summary:${NC}"
if [ $TOTAL_ERRORS -eq 0 ]; then
  echo -e "${GREEN}All files checked successfully with no errors!${NC}"
else
  echo -e "${RED}Found $TOTAL_ERRORS errors in $TOTAL_FILES_WITH_ERRORS files.${NC}"
fi

# Clean up temporary file
rm "$ERROR_OUTPUT"

# Print summary
echo -e "${YELLOW}Analysis complete!${NC}"
echo -e "${GREEN}Report saved to $REPORT_FILE${NC}" 