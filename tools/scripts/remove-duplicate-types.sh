#!/bin/bash

# Script to remove duplicate type declarations from database.ts
echo "Removing duplicate types from database.ts..."

# Backup the original file
cp src/types/database.ts src/types/database.ts.bak_$(date +%Y%m%d%H%M%S)

# Remove singularly named table types that have plural equivalents 
# For example, remove TokenTable if TokensTable exists
sed -i.tmp -E '/(export type).*Table[ ]*=[ ]*Tables<.*>/d' src/types/database.ts

# Remove the temporary file
rm src/types/database.ts.tmp

echo "Duplicate types removed successfully."