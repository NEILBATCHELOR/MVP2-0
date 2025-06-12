#!/bin/bash

# This script runs the generate-all-mappers.sh script and automatically answers "yes" to all prompts
# It generates type mappers for all missing domain types

echo "Starting to generate all missing type mappers..."

# Run the generate-all-mappers.sh script and pipe "y" to all prompts
./scripts/generate-all-mappers.sh << EOF
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
y
EOF

echo "All type mappers have been generated!"
echo "Run npm run types:validate to check if all issues have been resolved."