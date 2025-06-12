#!/bin/bash

# Token Service Migration Script
# This script updates import statements to use the new consolidated token services
# and then deletes redundant files

echo "Starting token service migration..."

# ==============================
# STEP 1: FIND AND REPLACE IMPORTS
# ==============================

# Function to safely replace imports in files
replace_in_files() {
  local search_pattern="$1"
  local replace_pattern="$2"
  local file_pattern="$3"
  
  echo "Replacing pattern: $search_pattern"
  
  # Find all files matching the pattern (excluding node_modules, .git, etc.)
  find src -type f -name "$file_pattern" \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/dist/*" \
    -not -path "*/scripts/*" \
    -not -path "*/build/*" \
    | while read -r file; do
      # Check if the file contains the pattern before attempting replacement
      if grep -q "$search_pattern" "$file"; then
        echo "  Updating imports in $file"
        # Using perl for better regex support than sed on macOS
        perl -i -pe "s|$search_pattern|$replace_pattern|g" "$file"
      fi
    done
}

# 1. Replace token apiService imports
replace_in_files "import \{([^}]*)\} from ['\"]@/services/token/apiService['\"]" "import {\1} from '@/services/token'" "*.ts*"
replace_in_files "import \* as tokenAPI from ['\"]@/services/token/apiService['\"]" "import * as tokenAPI from '@/services/token'" "*.ts*"

# 2. Replace createToken imports
replace_in_files "import \{([^}]*)\} from ['\"]@/services/token/createToken['\"]" "import {\1} from '@/services/token'" "*.ts*"
replace_in_files "import \* as createTokenModule from ['\"]@/services/token/createToken['\"]" "import * as createTokenModule from '@/services/token'" "*.ts*"

# 3. Replace updateToken imports
replace_in_files "import \{([^}]*)\} from ['\"]@/services/token/updateToken['\"]" "import {\1} from '@/services/token'" "*.ts*"
replace_in_files "import \* as updateTokenModule from ['\"]@/services/token/updateToken['\"]" "import * as updateTokenModule from '@/services/token'" "*.ts*"

# 4. Replace deleteToken imports
replace_in_files "import \{([^}]*)\} from ['\"]@/services/token/deleteToken['\"]" "import {\1} from '@/services/token'" "*.ts*"
replace_in_files "import \* as deleteTokenModule from ['\"]@/services/token/deleteToken['\"]" "import * as deleteTokenModule from '@/services/token'" "*.ts*"

# 5. Replace getTokens imports
replace_in_files "import \{([^}]*)\} from ['\"]@/services/token/getTokens['\"]" "import {\1} from '@/services/token'" "*.ts*"
replace_in_files "import \* as getTokensModule from ['\"]@/services/token/getTokens['\"]" "import * as getTokensModule from '@/services/token'" "*.ts*"

# 6. Replace tokenTemplates imports
replace_in_files "import \{([^}]*)\} from ['\"]@/services/token/tokenTemplates['\"]" "import {\1} from '@/services/token'" "*.ts*"
replace_in_files "import \* as tokenTemplatesModule from ['\"]@/services/token/tokenTemplates['\"]" "import * as tokenTemplatesModule from '@/services/token'" "*.ts*"

# 7. Replace crud imports
replace_in_files "import \{([^}]*)\} from ['\"]@/services/token/crud['\"]" "import {\1} from '@/services/token'" "*.ts*"
replace_in_files "import \* as crudModule from ['\"]@/services/token/crud['\"]" "import * as crudModule from '@/services/token'" "*.ts*"

# 8. Replace tokenTypes imports
replace_in_files "import \{([^}]*)\} from ['\"]@/services/token/tokenTypes['\"]" "import {\1} from '@/components/tokens/types'" "*.ts*"
replace_in_files "import \* as tokenTypesModule from ['\"]@/services/token/tokenTypes['\"]" "import * as tokenTypesModule from '@/components/tokens/types'" "*.ts*"

# 9. Replace tokenFunctions imports
replace_in_files "import \{([^}]*)\} from ['\"]@/services/token/tokenFunctions['\"]" "import {\1} from '@/services/token/transformers'" "*.ts*"
replace_in_files "import \* as tokenFunctionsModule from ['\"]@/services/token/tokenFunctions['\"]" "import * as tokenFunctionsModule from '@/services/token/transformers'" "*.ts*"

# 10. Replace integrations/tokenService imports
replace_in_files "import \{([^}]*)\} from ['\"]@/services/integrations/tokenService['\"]" "import {\1} from '@/services/token'" "*.ts*"
replace_in_files "import \* as integrationsTokenService from ['\"]@/services/integrations/tokenService['\"]" "import * as integrationsTokenService from '@/services/token'" "*.ts*"

# 11. Replace integrations/tokenTemplateService imports
replace_in_files "import \{([^}]*)\} from ['\"]@/services/integrations/tokenTemplateService['\"]" "import {\1} from '@/services/token'" "*.ts*"
replace_in_files "import \* as integrationsTemplateService from ['\"]@/services/integrations/tokenTemplateService['\"]" "import * as integrationsTemplateService from '@/services/token'" "*.ts*"

# 12. Replace useTokenCRUD imports with useTokens, useTokenTemplates
replace_in_files "import \{ useTokenCRUD \} from ['\"]@/components/tokens/hooks/useTokenCRUD['\"]" "import { useTokens, useTokenTemplates } from '@/components/tokens/hooks'" "*.ts*"
replace_in_files "import \{ useTokenCRUD([^}]*)\} from ['\"]@/components/tokens/hooks/useTokenCRUD['\"]" "import { useTokens, useTokenTemplates\1} from '@/components/tokens/hooks'" "*.ts*"

# 13. Update any instance where the hook is used
replace_in_files "const \{([^}]*), templates([^}]*)\} = useTokenCRUD\((.*)\)" "const {\1} = useTokens(\3);\n  const { templates\2 } = useTokenTemplates(\3)" "*.ts*"

echo "Import replacements completed!"

# ==============================
# STEP 2: CREATE HOOKS INDEX FILE
# ==============================

echo "Creating hooks index file..."

cat > src/components/tokens/hooks/index.ts << 'EOL'
// Centralized export for token hooks
export * from './useTokens';
export * from './useTokenTemplates';
export * from './useTokenForm';
export * from './useTokenDeployment';
export * from './useTokenValidation';
EOL

echo "Hooks index file created!"

# ==============================
# STEP 3: DELETE REDUNDANT FILES
# ==============================

# Create a backup directory
mkdir -p backups/token-services-$(date +%Y%m%d)

echo "Creating backups before deletion..."

# Backup redundant files before deleting
cp -v src/services/token/apiService.ts backups/token-services-$(date +%Y%m%d)/ 2>/dev/null || true
cp -v src/services/token/createToken.ts backups/token-services-$(date +%Y%m%d)/ 2>/dev/null || true
cp -v src/services/token/updateToken.ts backups/token-services-$(date +%Y%m%d)/ 2>/dev/null || true
cp -v src/services/token/deleteToken.ts backups/token-services-$(date +%Y%m%d)/ 2>/dev/null || true
cp -v src/services/token/getTokens.ts backups/token-services-$(date +%Y%m%d)/ 2>/dev/null || true
cp -v src/services/token/tokenTemplates.ts backups/token-services-$(date +%Y%m%d)/ 2>/dev/null || true
cp -v src/services/token/crud.ts backups/token-services-$(date +%Y%m%d)/ 2>/dev/null || true
cp -v src/services/token/tokenTypes.ts backups/token-services-$(date +%Y%m%d)/ 2>/dev/null || true
cp -v src/services/token/tokenFunctions.ts backups/token-services-$(date +%Y%m%d)/ 2>/dev/null || true
cp -v src/services/integrations/tokenService.ts backups/token-services-$(date +%Y%m%d)/ 2>/dev/null || true
cp -v src/services/integrations/tokenTemplateService.ts backups/token-services-$(date +%Y%m%d)/ 2>/dev/null || true
cp -v src/components/tokens/hooks/useTokenCRUD.ts backups/token-services-$(date +%Y%m%d)/ 2>/dev/null || true

echo "Files backed up. Now removing redundant files..."

# List of files to delete
FILES_TO_DELETE=(
  "src/services/token/apiService.ts"
  "src/services/token/createToken.ts"
  "src/services/token/updateToken.ts"
  "src/services/token/deleteToken.ts"
  "src/services/token/getTokens.ts"
  "src/services/token/tokenTemplates.ts"
  "src/services/token/crud.ts"
  "src/services/token/tokenTypes.ts"
  "src/services/token/tokenFunctions.ts"
  # The following commented files will be dealt with later, after thorough testing
  # "src/services/integrations/tokenService.ts"
  # "src/services/integrations/tokenTemplateService.ts"
  # "src/components/tokens/hooks/useTokenCRUD.ts"
)

# Delete files
for file in "${FILES_TO_DELETE[@]}"; do
  if [ -f "$file" ]; then
    echo "Deleting $file"
    rm "$file"
  else
    echo "Warning: $file not found to delete"
  fi
done

echo "Migration completed successfully!"
echo "NOTE: Integration services and useTokenCRUD were NOT deleted for safety."
echo "      Please delete them manually after thorough testing."