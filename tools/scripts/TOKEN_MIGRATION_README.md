# Token Service Migration Guide

This directory contains scripts to migrate from the old, scattered token services to the new consolidated implementation.

## Migration Steps

### 1. Preparation

Before running the migration scripts:

1. Ensure you have committed all your changes to git
2. Run a comprehensive test suite to establish a baseline

### 2. Run the Migration Script

```bash
# Make the scripts executable
chmod +x scripts/token-service-migration.sh
chmod +x scripts/token-service-rollback.sh
chmod +x scripts/token-service-cleanup-phase2.sh

# Run the migration script
./scripts/token-service-migration.sh
```

This script will:
- Update import statements throughout the codebase
- Create a hooks index file
- Backup the old files before deleting them
- Delete redundant token service files

### 3. Testing

After the migration:

1. Run the application and verify it starts without errors
2. Test all token-related functionality
3. Run the test suite and verify all tests pass

### 4. Rollback (if needed)

If you encounter issues:

```bash
# Run the rollback script
./scripts/token-service-rollback.sh
```

This will restore the backup files created during migration.

### 5. Phase 2 Cleanup

After thorough testing and verifying everything works correctly:

```bash
# Run the phase 2 cleanup
./scripts/token-service-cleanup-phase2.sh
```

This will remove the integration services and hooks that were left in place during the initial migration.

## File Changes Summary

### Files Removed in Phase 1
- src/services/token/apiService.ts
- src/services/token/createToken.ts
- src/services/token/updateToken.ts
- src/services/token/deleteToken.ts
- src/services/token/getTokens.ts
- src/services/token/tokenTemplates.ts
- src/services/token/crud.ts
- src/services/token/tokenTypes.ts
- src/services/token/tokenFunctions.ts

### Files Removed in Phase 2
- src/services/integrations/tokenService.ts
- src/services/integrations/tokenTemplateService.ts
- src/components/tokens/hooks/useTokenCRUD.ts

### New Files Added
- src/services/token/tokenService.ts
- src/services/token/templateService.ts
- src/services/token/transformers.ts
- src/services/token/validators.ts
- src/services/token/index.ts
- src/components/tokens/hooks/useTokens.ts
- src/components/tokens/hooks/useTokenTemplates.ts
- src/components/tokens/hooks/index.ts

## Additional Notes

- The migration preserves all specialized token operations (burn, mint, etc.)
- Backup files are stored in the `backups/token-services-YYYYMMDD` directory
- If you have any custom logic in the old files, review the backups and integrate that logic into the new implementation