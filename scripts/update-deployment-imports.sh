#!/bin/bash

# Script to update import paths from infrastructure/deployment to services/deployment
# Created for consolidating duplicate deployment directories

echo "🔍 Searching for import references to infrastructure/deployment..."

# Define source directory
SRC_DIR="/Users/neilbatchelor/Cursor/Chain Capital Production/src"

# Find all TypeScript/JavaScript files
echo "📁 Scanning TypeScript and JavaScript files..."

# Search for imports from infrastructure/deployment
echo "🔎 Looking for @/infrastructure/deployment imports..."
grep -r "@/infrastructure/deployment" "$SRC_DIR" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | while read -r line; do
    echo "Found: $line"
done

# Search for relative imports to infrastructure/deployment
echo "🔎 Looking for relative imports to infrastructure/deployment..."
grep -r "infrastructure/deployment" "$SRC_DIR" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | while read -r line; do
    echo "Found: $line"
done

# Search for any remaining references to the old interfaces
echo "🔎 Looking for imports from DeploymentInterfaces or TransactionInterfaces in infrastructure..."
grep -r "infrastructure.*DeploymentInterfaces\|infrastructure.*TransactionInterfaces" "$SRC_DIR" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | while read -r line; do
    echo "Found: $line"
done

echo "✅ Search complete!"
echo ""
echo "🔧 To fix any found imports, update them to use:"
echo "   @/services/deployment instead of @/infrastructure/deployment"
echo "   @/services/deployment/interfaces/DeploymentInterfaces"
echo "   @/services/deployment/interfaces/TransactionInterfaces"
echo "   @/services/deployment/notifications/DeploymentNotificationManager"
echo "   @/services/deployment/notifications/TransactionNotifier"
