#!/bin/bash

# Package Usage Verification Script
# Searches source code for actual package usage

echo "🔍 Package Usage Verification"
echo "============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to search for package usage
check_usage() {
    local package=$1
    local search_term=${2:-$package}
    
    echo -n "Checking $package... "
    
    # Search in src directory
    local found=0
    
    # Check for imports
    if grep -r "import.*$search_term" src/ > /dev/null 2>&1; then
        found=1
    fi
    
    # Check for require statements
    if grep -r "require.*$search_term" src/ > /dev/null 2>&1; then
        found=1
    fi
    
    # Check for usage in config files
    if grep -r "$search_term" *.config.* > /dev/null 2>&1; then
        found=1
    fi
    
    if [ $found -eq 1 ]; then
        echo -e "${GREEN}USED${NC}"
        return 0
    else
        echo -e "${RED}NOT FOUND${NC}"
        return 1
    fi
}

echo -e "${BLUE}Checking Web3 packages:${NC}"
echo "========================"
unused_web3=()

packages_to_check=(
    "@reown/appkit"
    "@reown/appkit-adapter-wagmi" 
    "wagmi"
    "viem"
    "ethers"
)

for pkg in "${packages_to_check[@]}"; do
    if ! check_usage "$pkg"; then
        unused_web3+=("$pkg")
    fi
done

echo ""
echo -e "${BLUE}Checking feature packages:${NC}"
echo "=========================="
unused_features=()

feature_packages=(
    "tesseract.js:tesseract"
    "react-webcam:webcam"
    "vaul:vaul"
    "embla-carousel-react:embla"
    "@hello-pangea/dnd:dnd"
    "jspdf-autotable:autotable"
    "sharp:sharp"
    "ws:ws"
    "chalk:chalk"
    "ts-morph:morph"
)

for pkg_info in "${feature_packages[@]}"; do
    IFS=':' read -r pkg search_term <<< "$pkg_info"
    if ! check_usage "$pkg" "$search_term"; then
        unused_features+=("$pkg")
    fi
done

echo ""
echo -e "${BLUE}Checking server packages:${NC}"
echo "========================="
unused_server=()

server_packages=(
    "express"
    "cors"
)

for pkg in "${server_packages[@]}"; do
    if ! check_usage "$pkg"; then
        unused_server+=("$pkg")
    fi
done

echo ""
echo "📊 SUMMARY"
echo "=========="
echo ""

if [ ${#unused_web3[@]} -gt 0 ]; then
    echo -e "${RED}Unused Web3 packages:${NC}"
    printf '  %s\n' "${unused_web3[@]}"
    echo ""
fi

if [ ${#unused_features[@]} -gt 0 ]; then
    echo -e "${YELLOW}Unused feature packages:${NC}"
    printf '  %s\n' "${unused_features[@]}"
    echo ""
fi

if [ ${#unused_server[@]} -gt 0 ]; then
    echo -e "${YELLOW}Unused server packages:${NC}"
    printf '  %s\n' "${unused_server[@]}"
    echo ""
fi

# Generate removal command
all_unused=("${unused_web3[@]}" "${unused_features[@]}" "${unused_server[@]}")

if [ ${#all_unused[@]} -gt 0 ]; then
    echo -e "${BLUE}Suggested removal command:${NC}"
    echo "npm uninstall \\"
    for i in "${!all_unused[@]}"; do
        if [ $i -eq $((${#all_unused[@]} - 1)) ]; then
            echo "  ${all_unused[$i]}"
        else
            echo "  ${all_unused[$i]} \\"
        fi
    done
else
    echo -e "${GREEN}All packages appear to be in use!${NC}"
fi

echo ""
echo -e "${YELLOW}Note: This is a basic text search. Some packages might be used indirectly${NC}"
echo -e "${YELLOW}or in ways this script can't detect. Always test after removal!${NC}"
