#!/bin/bash

# Token Service Rollback Script
# This script restores the backup files created during migration

echo "Starting rollback process..."

# Get the latest backup directory
LATEST_BACKUP=$(ls -d backups/token-services-* | sort -r | head -n 1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "Error: No backup directory found. Cannot proceed with rollback."
  exit 1
fi

echo "Found backup directory: $LATEST_BACKUP"
echo "Restoring files from backup..."

# Restore files from backup
cp -v "$LATEST_BACKUP/apiService.ts" src/services/token/ 2>/dev/null || echo "Warning: apiService.ts not found in backup"
cp -v "$LATEST_BACKUP/createToken.ts" src/services/token/ 2>/dev/null || echo "Warning: createToken.ts not found in backup"
cp -v "$LATEST_BACKUP/updateToken.ts" src/services/token/ 2>/dev/null || echo "Warning: updateToken.ts not found in backup"
cp -v "$LATEST_BACKUP/deleteToken.ts" src/services/token/ 2>/dev/null || echo "Warning: deleteToken.ts not found in backup"
cp -v "$LATEST_BACKUP/getTokens.ts" src/services/token/ 2>/dev/null || echo "Warning: getTokens.ts not found in backup"
cp -v "$LATEST_BACKUP/tokenTemplates.ts" src/services/token/ 2>/dev/null || echo "Warning: tokenTemplates.ts not found in backup"
cp -v "$LATEST_BACKUP/crud.ts" src/services/token/ 2>/dev/null || echo "Warning: crud.ts not found in backup"
cp -v "$LATEST_BACKUP/tokenTypes.ts" src/services/token/ 2>/dev/null || echo "Warning: tokenTypes.ts not found in backup"
cp -v "$LATEST_BACKUP/tokenFunctions.ts" src/services/token/ 2>/dev/null || echo "Warning: tokenFunctions.ts not found in backup"
cp -v "$LATEST_BACKUP/tokenService.ts" src/services/integrations/ 2>/dev/null || echo "Warning: tokenService.ts not found in backup"
cp -v "$LATEST_BACKUP/tokenTemplateService.ts" src/services/integrations/ 2>/dev/null || echo "Warning: tokenTemplateService.ts not found in backup"
cp -v "$LATEST_BACKUP/useTokenCRUD.ts" src/components/tokens/hooks/ 2>/dev/null || echo "Warning: useTokenCRUD.ts not found in backup"

echo "Rollback completed. Please check the files manually to ensure everything is restored correctly."
echo "You may need to manually revert import changes in your files."