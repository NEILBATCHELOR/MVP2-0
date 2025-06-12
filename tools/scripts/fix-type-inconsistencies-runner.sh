#!/bin/bash

# This script runs the fix-type-inconsistencies.ts script and updates the database.ts file
# with the correct type names to match the database tables

echo "Running type inconsistency fixer..."
node --loader ts-node/esm scripts/fix-type-inconsistencies.ts << EOF
y
EOF

echo "Type inconsistencies fixed!"
echo "Run npm run types:validate to check if all issues have been resolved."