#!/bin/bash

# Dependency Cleanup Script for Chain Capital Project
# This script safely removes unused dependencies

set -e  # Exit on any error

echo "🧹 Chain Capital - Dependency Cleanup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if package exists in package.json
check_package() {
    if npm list "$1" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to safely remove packages
safe_remove() {
    local packages=("$@")
    local to_remove=()
    
    echo -e "${BLUE}Checking which packages are actually installed...${NC}"
    
    for package in "${packages[@]}"; do
        if check_package "$package"; then
            to_remove+=("$package")
            echo -e "  ✓ Found: $package"
        else
            echo -e "  ⚠ Not installed: $package"
        fi
    done
    
    if [ ${#to_remove[@]} -eq 0 ]; then
        echo -e "${YELLOW}No packages to remove in this category.${NC}"
        return
    fi
    
    echo -e "${YELLOW}Removing ${#to_remove[@]} packages...${NC}"
    npm uninstall "${to_remove[@]}"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Successfully removed packages${NC}"
    else
        echo -e "${RED}❌ Error removing packages${NC}"
        exit 1
    fi
}

# Backup package.json
echo -e "${BLUE}📋 Creating backup of package.json...${NC}"
cp package.json package.json.backup
echo -e "${GREEN}✅ Backup created: package.json.backup${NC}"
echo ""

# Phase 1: Remove unused Web3 packages
echo -e "${YELLOW}Phase 1: Removing unused Web3 packages${NC}"
echo "============================================"
web3_packages=(
    "@reown/appkit"
    "@reown/appkit-adapter-wagmi" 
    "wagmi"
)

echo "These packages are installed but not used in your codebase:"
echo "- Your project uses ethers.js extensively"
echo "- No @reown/appkit or wagmi imports found in source code"
echo ""

read -p "Remove unused Web3 packages? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    safe_remove "${web3_packages[@]}"
else
    echo "Skipping Web3 package removal..."
fi
echo ""

# Phase 2: Remove CLI/development tools
echo -e "${YELLOW}Phase 2: Removing CLI/development tools${NC}"
echo "========================================"
cli_packages=(
    "shadcn-ui"
    "ts-morph"
    "chalk"
)

echo "These are CLI tools that don't need to be runtime dependencies:"
for pkg in "${cli_packages[@]}"; do
    echo "- $pkg"
done
echo ""

read -p "Remove CLI tools? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    safe_remove "${cli_packages[@]}"
else
    echo "Skipping CLI tool removal..."
fi
echo ""

# Phase 3: Remove potentially unused feature packages
echo -e "${YELLOW}Phase 3: Potentially unused feature packages${NC}"
echo "============================================="
feature_packages=(
    "tesseract.js"
    "react-webcam"
    "vaul"
    "embla-carousel-react"
    "@hello-pangea/dnd"
    "jspdf-autotable"
    "sharp"
)

echo "These packages provide specific features that may not be used:"
echo "- tesseract.js: OCR functionality"
echo "- react-webcam: Camera capture"
echo "- vaul: Drawer component"
echo "- embla-carousel-react: Carousel component"
echo "- @hello-pangea/dnd: Drag and drop"
echo "- jspdf-autotable: PDF table generation"
echo "- sharp: Image processing (server-side)"
echo ""
echo -e "${RED}⚠️ WARNING: Only remove these if you're sure they're not used!${NC}"
echo ""

read -p "Remove potentially unused feature packages? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    safe_remove "${feature_packages[@]}"
else
    echo "Skipping feature package removal..."
fi
echo ""

# Phase 4: Remove server dependencies (if client-only)
echo -e "${YELLOW}Phase 4: Server-side dependencies${NC}"
echo "=================================="
server_packages=(
    "express"
    "cors"
    "ws"
)

echo "These are server-side packages:"
for pkg in "${server_packages[@]}"; do
    echo "- $pkg"
done
echo ""
echo -e "${RED}⚠️ WARNING: Only remove if this is a client-only application!${NC}"
echo ""

read -p "Is this a client-only application? Remove server packages? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    safe_remove "${server_packages[@]}"
else
    echo "Keeping server packages..."
fi
echo ""

# Phase 5: Remove polyfills (if modern browsers only)
echo -e "${YELLOW}Phase 5: Polyfills and legacy support${NC}"
echo "====================================="
polyfill_packages=(
    "rollup-plugin-polyfill-node"
    "node-fetch"
)

echo "These provide polyfills for older environments:"
echo "- rollup-plugin-polyfill-node: Node.js polyfills for browser"
echo "- node-fetch: Fetch API polyfill (not needed in modern Node.js/browsers)"
echo ""

read -p "Remove polyfills? (only if targeting modern browsers/Node.js) (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    safe_remove "${polyfill_packages[@]}"
else
    echo "Keeping polyfills..."
fi
echo ""

# Final steps
echo -e "${BLUE}🔧 Running final cleanup...${NC}"
echo "=========================="

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Update package-lock.json
echo "Updating package-lock.json..."
npm install

# Run audit
echo "Running security audit..."
npm audit

echo ""
echo -e "${GREEN}🎉 Cleanup completed successfully!${NC}"
echo "=================================="
echo ""
echo "Summary:"
echo "- Original package.json backed up to package.json.backup"
echo "- Dependencies have been cleaned up"
echo "- Package-lock.json has been updated"
echo "- Security audit completed"
echo ""
echo "Next steps:"
echo "1. Test your application: npm run dev"
echo "2. Run tests if you have them: npm test"
echo "3. If everything works, you can delete package.json.backup"
echo ""
echo -e "${YELLOW}If you encounter any issues, restore from backup:${NC}"
echo "cp package.json.backup package.json && npm install"
