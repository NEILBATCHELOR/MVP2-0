#!/bin/bash
# Script to analyze TypeScript type errors in specific files

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create a new report file
REPORT_FILE="type-analysis-report.md"
echo "# Type Analysis Report" > $REPORT_FILE
echo "Generated on $(date)" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Run symlinks script first to ensure paths are correct
echo -e "${YELLOW}Setting up path resolution...${NC}"
./scripts/create-symlinks.sh

# Files to check
FILES=(
  "src/components/home.tsx"
  "src/components/redemption/RedemptionStatusSubscriber.tsx"
  "src/components/redemption/dashboard/RedemptionRequestList.tsx"
  "src/components/rules/ApprovalWorkflow.tsx"
  "src/components/rules/story/ApprovalDashboardStory.tsx"
  "src/components/subscriptions/SubscriptionManager.tsx"
  "src/components/tokens/standards/ERC1400/InvestorSection.tsx"
  "src/components/tokens/standards/ERC1400/PartitionSection.tsx"
  "src/lib/dashboardData.ts"
  "src/lib/documentStorage.ts"
  "src/lib/investors.ts"
  "src/lib/projects.ts"
  "src/lib/redemptions.ts"
  "src/lib/subscriptions.ts"
  "src/lib/web3/WalletManager.ts"
  "src/services/realtimeService.ts"
)

# Counters
TOTAL_ERRORS=0
FILES_WITH_ERRORS=0

echo -e "${YELLOW}Running TypeScript type check...${NC}"

# Function to check a file for type errors
check_file() {
  local file=$1
  echo -e "${YELLOW}Checking $file...${NC}"
  
  # Run TypeScript compiler on the file and capture output
  TMP_OUT=$(mktemp)
  npx tsc --noEmit --skipLibCheck "$file" 2> $TMP_OUT
  
  # Count errors
  ERROR_COUNT=$(grep -c "error TS" $TMP_OUT)
  
  if [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${GREEN}No errors in $file${NC}"
    echo "## ✅ $file" >> $REPORT_FILE
    echo "No type errors found." >> $REPORT_FILE
  else
    echo -e "${RED}Found $ERROR_COUNT errors in $file${NC}"
    echo "## ❌ $file" >> $REPORT_FILE
    echo "**$ERROR_COUNT errors found**" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    echo "```" >> $REPORT_FILE
    cat $TMP_OUT >> $REPORT_FILE
    echo "```" >> $REPORT_FILE
    
    TOTAL_ERRORS=$((TOTAL_ERRORS + ERROR_COUNT))
    FILES_WITH_ERRORS=$((FILES_WITH_ERRORS + 1))
  fi
  
  echo "" >> $REPORT_FILE
  rm $TMP_OUT
}

# Check each file
for file in "${FILES[@]}"; do
  # Check if file exists
  if [ -f "$file" ]; then
    check_file "$file"
  else
    echo -e "${YELLOW}Warning: $file does not exist, skipping${NC}"
    echo "## ⚠️ $file" >> $REPORT_FILE
    echo "File does not exist." >> $REPORT_FILE
    echo "" >> $REPORT_FILE
  fi
done

# Add summary to report
echo "# Summary" >> $REPORT_FILE
echo "- Total errors: $TOTAL_ERRORS" >> $REPORT_FILE
echo "- Files with errors: $FILES_WITH_ERRORS / ${#FILES[@]}" >> $REPORT_FILE

# Print summary
echo -e "${YELLOW}Summary:${NC}"
echo -e "- Total errors: ${RED}$TOTAL_ERRORS${NC}"
echo -e "- Files with errors: ${RED}$FILES_WITH_ERRORS${NC} / ${#FILES[@]}"
echo -e "${GREEN}Report saved to $REPORT_FILE${NC}" 