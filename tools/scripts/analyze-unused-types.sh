#!/bin/bash

# Script to analyze unused TypeScript types across the project
# This is a shell wrapper for the analyze-unused-types.ts script

# Exit on error
set -e

# Get the directory of this script and set it as the working directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Check if required dependencies are installed in node_modules
if [ ! -d "node_modules/typescript" ]; then
  echo "Error: TypeScript is not installed. Please run 'npm install typescript' or 'yarn add typescript' first."
  exit 1
fi

if [ ! -d "node_modules/ts-morph" ]; then
  echo "Error: ts-morph is not installed. Please run 'npm install ts-morph' or 'yarn add ts-morph' first."
  exit 1
fi

# Display usage information
function usage() {
  echo "Usage: analyze-unused-types.sh"
  echo ""
  echo "This script analyzes unused TypeScript types across the project."
  echo "It generates two reports:"
  echo "  - unused-files-report.txt: Lists files that aren't imported or referenced"
  echo "  - type-extensions-report.json: JSON file showing where types are extended"
  echo ""
  echo "Options:"
  echo "  -h, --help    Display this help message"
}

# Handle help argument
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
  usage
  exit 0
fi

# Run the TypeScript script with tsx (better ESM support)
echo "Analyzing unused TypeScript types..."
npx tsx "$SCRIPT_DIR/analyze-unused-types.ts"

# Check if the report files were generated
if [ -f "unused-files-report.txt" ] && [ -f "type-extensions-report.json" ]; then
  echo "Reports have been generated:"
  echo "  - $(pwd)/unused-files-report.txt"
  echo "  - $(pwd)/type-extensions-report.json"
else
  echo "Error: One or more reports were not generated."
  exit 1
fi 