#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Fixing import paths in TypeScript files...${NC}"

# Process all TypeScript files
find src -type f -name "*.ts" -o -name "*.tsx" | while read -r file; do
  # Replace incorrect imports with correct ones
  sed -i '' 's|@/types/supabase|@/types/database|g' "$file"
  sed -i '' 's|import { Investor } from "@/types/models"|import { Investor } from "@/types/centralModels"|g' "$file"
  sed -i '' 's|import type { Project } from "@/types/models"|import type { Project } from "@/types/centralModels"|g' "$file"
  sed -i '' 's|import { RedemptionRequest } from "@/types/models"|import { RedemptionRequest } from "@/types/centralModels"|g' "$file"
  sed -i '' 's|import { mapDbInvestorToInvestor } from "@/utils/typeMappers"|import { mapDbInvestorToInvestor } from "@/utils/typeMappers"|g' "$file"
  
  # Check if file changed
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Fixed imports in $file${NC}"
  fi
done

echo -e "${YELLOW}Import paths fixed!${NC}" 