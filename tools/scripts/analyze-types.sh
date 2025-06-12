#!/bin/bash

# Script to analyze TypeScript type errors across the project
# This is a shell wrapper for the analyze-types.ts script

# Exit on error
set -e

# Get the directory of this script and set it as the working directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Check if typescript is installed
if ! npx --no-install typescript --version >/dev/null 2>&1; then
  echo "Error: TypeScript is not installed. Please run 'npm install typescript' or 'yarn add typescript' first."
  exit 1
fi

# Display usage information
function usage() {
  echo "Usage: analyze-types.sh [file_paths...]"
  echo ""
  echo "This script analyzes TypeScript type errors across the project."
  echo "If file paths are provided, it will only analyze those files."
  echo "Otherwise, it will analyze a predefined list of files."
  echo ""
  echo "Options:"
  echo "  -h, --help    Display this help message"
}

# Handle help argument
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
  usage
  exit 0
fi

# Build the command: run the TypeScript script with ts-node
# Any arguments are passed to the TypeScript script
echo "Analyzing TypeScript type issues..."
if command -v ts-node >/dev/null 2>&1; then
  # If ts-node is available, use it directly
  npx ts-node "$SCRIPT_DIR/analyze-types.ts" "$@"
else
  # Fallback to using npx ts-node
  npx --no-install ts-node "$SCRIPT_DIR/analyze-types.ts" "$@"
fi

# If the script ran successfully, the report file should exist
if [ -f "type-analysis-report.md" ]; then
  echo "Report has been generated at: $(pwd)/type-analysis-report.md"
else
  echo "Error: The report was not generated."
  exit 1
fi 