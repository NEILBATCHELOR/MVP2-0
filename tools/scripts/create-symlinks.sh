#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up symlinks for import resolution...${NC}"

# Create symlinks for @/ path alias
mkdir -p node_modules/@
ln -sf $(pwd)/src node_modules/@/
mkdir -p node_modules/@/components
ln -sf $(pwd)/src/components node_modules/@/components
mkdir -p node_modules/@/lib
ln -sf $(pwd)/src/lib node_modules/@/lib
mkdir -p node_modules/@/context
ln -sf $(pwd)/src/context node_modules/@/context
mkdir -p node_modules/@/services
ln -sf $(pwd)/src/services node_modules/@/services
mkdir -p node_modules/@/hooks
ln -sf $(pwd)/src/hooks node_modules/@/hooks
mkdir -p node_modules/@/utils
ln -sf $(pwd)/src/utils node_modules/@/utils
mkdir -p node_modules/@/types
ln -sf $(pwd)/src/types node_modules/@/types

# Create symlinks for UI components (common pattern in many projects)
mkdir -p node_modules/@/components/ui
ln -sf $(pwd)/src/components/ui node_modules/@/components/ui

# Create symlinks for specific files
mkdir -p node_modules/@/lib/supabase
ln -sf $(pwd)/src/lib/supabase.ts node_modules/@/lib/supabase.ts

# Ensure node_modules/@supabase exists
mkdir -p node_modules/@supabase

echo -e "${GREEN}Symlinks created successfully!${NC}" 