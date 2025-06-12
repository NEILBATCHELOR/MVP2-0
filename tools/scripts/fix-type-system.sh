#!/bin/bash

# This script provides a complete solution for fixing type inconsistencies
# It runs the fix script, removes duplicates, and validates the results

echo "🔧 Starting Type System Fix..."
echo "==============================="

# Step 1: Run the fix-type-inconsistencies script
echo "Step 1: Running fix-type-inconsistencies.ts..."
node --loader ts-node/esm scripts/fix-type-inconsistencies.ts << EOF
y
EOF

# Step 2: Remove duplicate type declarations
echo "Step 2: Removing duplicate type declarations..."
./scripts/remove-duplicate-types.sh

# Step 3: Validate the type system
echo "Step 3: Validating the type system..."
node --loader ts-node/esm scripts/validate-types.ts

echo "Type system fix complete!"
echo "If there are any remaining issues, please address them manually."