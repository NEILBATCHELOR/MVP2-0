#!/usr/bin/env bash

# Fix all remaining ERC validation scripts with environment variable and blocks data issues

echo "🔧 Fixing validation scripts..."

SCRIPTS_DIR="/Users/neilbatchelor/Cursor/Chain Capital Production/scripts"

# List of scripts to fix (ERC-20 and ERC-721 already fixed)
SCRIPTS_TO_FIX=(
  "validate-erc1155-crud.ts"
  "validate-erc1400-crud.ts" 
  "validate-erc3525-crud.ts"
  "validate-erc4626-crud.ts"
)

for script in "${SCRIPTS_TO_FIX[@]}"; do
  script_path="$SCRIPTS_DIR/$script"
  
  if [ -f "$script_path" ]; then
    echo "📄 Fixing $script..."
    
    # 1. Add dotenv import after the comment header
    # Find the line with the first import and insert dotenv before it
    sed -i '' '/^import.*{.*createClient.*}/i\
// Load environment variables\
import '\''dotenv/config'\'';\
' "$script_path"
    
    # 2. Replace import.meta.env with process.env
    sed -i '' 's/import\.meta\.env\./process.env./g' "$script_path"
    
    echo "  ✅ Fixed environment variables in $script"
  else
    echo "  ⚠️ Script not found: $script"
  fi
done

echo "🎉 All validation scripts fixed!"
echo ""
echo "📋 Summary of fixes applied:"
echo "  - Added dotenv/config import to load environment variables"
echo "  - Replaced import.meta.env with process.env for Node.js compatibility"
echo ""
echo "⚠️ Note: You may still need to fix token creation blocks data manually"
echo "   for scripts that don't follow the ERC-20/ERC-721 pattern"
