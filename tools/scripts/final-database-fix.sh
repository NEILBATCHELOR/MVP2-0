#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Fixing remaining database type issues...${NC}"

# Ensure the types directory exists
mkdir -p src/types

# Create Empty ReactNode type definition
cat > src/types/types.d.ts << EOL
import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      children?: React.ReactNode;
    }
  }
}
EOL

# Create extended interface for TokenAllocation
cat > src/components/captable/types.ts << EOL
import { TokenAllocation } from '@/types/centralModels';

export interface ExtendedTokenAllocation extends TokenAllocation {
  id: string;
  investorName: string;
  investorEmail?: string;
  tokenType: string;
  allocatedAmount: number;
  subscribedAmount: number;
  walletAddress?: string;
  allocationConfirmed: boolean;
}
EOL

# Create a symlink to the database types in the node_modules directory
echo -e "Creating additional symlinks for database types..."
mkdir -p node_modules/@/types
ln -sf $(pwd)/src/types/database.ts node_modules/@/types/database.ts
ln -sf $(pwd)/src/types/centralModels.ts node_modules/@/types/centralModels.ts

echo -e "${GREEN}Database type fixes applied!${NC}"
echo -e "${YELLOW}Project should now compile with minimal type errors.${NC}" 