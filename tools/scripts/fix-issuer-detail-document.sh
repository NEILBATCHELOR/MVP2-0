#!/bin/bash

# This script fixes the IssuerDetailDocumentTable interface in database.ts

echo "Fixing IssuerDetailDocumentTable interface..."

# Create a backup of the original file
cp src/types/database.ts src/types/database.ts.bak2

# Replace the broken interface with a fixed version
sed -i '' 's/export type IssuerDetailDocumentTable = Tables<'\''issuer_detail_documents'\''> & {\n  is_public?: boolean;\n}/export interface IssuerDetailDocumentTable extends Tables<'\''issuer_detail_documents'\''> {\n  is_public?: boolean;\n}/' src/types/database.ts

echo "IssuerDetailDocumentTable interface fixed!"