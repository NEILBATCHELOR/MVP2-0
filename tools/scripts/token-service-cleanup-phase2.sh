#!/bin/bash

# Token Service Cleanup Phase 2
# This script removes the integration services and hooks that were left in place during the initial migration

echo "Starting Phase 2 cleanup process..."

# Files to delete in phase 2
FILES_TO_DELETE=(
  "src/services/integrations/tokenService.ts"
  "src/services/integrations/tokenTemplateService.ts"
  "src/components/tokens/hooks/useTokenCRUD.ts"
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

echo "Phase 2 cleanup completed!"
echo "The migration to the new token services architecture is now complete."